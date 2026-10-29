import { Effect, Layer } from 'effect'
import { AppConfig } from '@/features/config'
import { EvidenceStore } from '@/features/evidence'
import { QlooNotFoundError, QlooServiceError } from './error'
import {
  QlooService,
  type QlooEntityType,
  type QlooInsightsArgs,
  type QlooInsightsResult
} from './interface'

const ENTITY_TYPES: ReadonlyArray<QlooEntityType> = [
  'artist',
  'brand',
  'place',
  'movie',
  'tv_show',
  'book',
  'podcast',
  'video_game',
  'destination',
  'person'
]

const shortType = (wireType: unknown, fallback: QlooEntityType): QlooEntityType =>
  ENTITY_TYPES.includes(wireType as QlooEntityType)
    ? (wireType as QlooEntityType)
    : fallback

export const QlooServiceLive = Layer.effect(
  QlooService,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const evidence = yield* EvidenceStore
    const baseUrl = config.qloo.baseUrl.replace(/\/$/, '')

    const call = Effect.fnUntraced(function* (
      path: string,
      params: Record<string, string | undefined>
    ) {
      const url = new URL(`${baseUrl}${path}`)
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, value)
      }

      // X-Api-Key travels in the header only — the URL is safe to log/store.
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetch(url, {
            headers: {
              'X-Api-Key': config.qloo.apiKey,
              Accept: 'application/json'
            }
          })
          const json = await response.json().catch(() => undefined)
          return { ok: response.ok, status: response.status, json }
        },
        catch: (cause) => new QlooServiceError({ cause })
      })

      const refId = yield* evidence.append({
        request: { method: 'GET', url: url.toString() },
        response: result.json
      })
      yield* Effect.logDebug(
        `[qloo] GET ${path} -> ${result.status} (evidence ${refId})`
      )

      if (!result.ok) {
        if (result.status === 404) {
          return yield* Effect.fail(new QlooNotFoundError({ query: path }))
        }
        return yield* Effect.fail(
          new QlooServiceError({ cause: `Qloo responded ${result.status}` })
        )
      }
      return { json: result.json, refId }
    })

    const resultsOf = (json: unknown) =>
      (json as { results?: Array<Record<string, unknown>> } | undefined)
        ?.results ?? []

    const insightsRequest = (
      filterType: string,
      args: Omit<QlooInsightsArgs, 'filterType'>
    ) =>
      call('/v2/insights', {
        'filter.type': filterType,
        'signal.interests.entities': args.signalEntityIds?.join(','),
        'signal.interests.tags': args.signalTagIds?.join(','),
        'location.query': args.locationNear,
        tags: args.tags?.join(',')
      })

    const scoreOf = (record: Record<string, unknown>, index: number) =>
      typeof record.score === 'number'
        ? record.score
        : typeof record.popularity === 'number'
          ? record.popularity
          : typeof (record.properties as { affinity?: unknown } | undefined)
                ?.affinity === 'number'
            ? (record.properties as { affinity: number }).affinity
            : Math.round((1 - index * 0.05) * 100) / 100

    // Empty results are normal, not an error. Entity calls return
    // results.entities[].
    const insightsCall = (args: QlooInsightsArgs) =>
      insightsRequest(`urn:entity:${args.filterType}`, args).pipe(
        Effect.map((jsonAndRef): QlooInsightsResult => {
          const wireRecords =
            (jsonAndRef.json as {
              results?: { entities?: Array<Record<string, unknown>> }
            })?.results?.entities ?? []
          const entities = wireRecords.map((entity, index) => ({
            id: String(entity.id ?? entity.entity_id ?? ''),
            name: String(entity.name ?? ''),
            type: shortType(entity.type, args.filterType),
            score: scoreOf(entity, index),
            tags: Array.isArray(entity.tags)
              ? (entity.tags as unknown[]).map(String)
              : undefined
          }))
          return { entities, evidenceRefs: [jsonAndRef.refId] }
        }),
        Effect.withSpan('qloo.insights')
      )

    // filter.type=urn:tag (taste analysis) returns audience tags for the
    // signals under results.tags[] — tags, not entities, so no entity type.
    const tagInsightsCall = (args: Omit<QlooInsightsArgs, 'filterType'>) =>
      insightsRequest('urn:tag', args).pipe(
        Effect.map((jsonAndRef) => {
          const wireRecords =
            (jsonAndRef.json as {
              results?: { tags?: Array<Record<string, unknown>> }
            })?.results?.tags ?? []
          const tags = wireRecords.map((tag, index) => ({
            id: String(tag.id ?? tag.tag_id ?? ''),
            name: String(tag.name ?? ''),
            score: scoreOf(tag, index)
          }))
          return { tags, evidenceRefs: [jsonAndRef.refId] }
        }),
        Effect.withSpan('qloo.insights')
      )

    // Shared pipeline: tag insights + per-domain affinities off a set of
    // REAL signal entity ids. Qloo 400s the whole call on invented ids.
    const profileFromSignals = (entityIds: ReadonlyArray<string>) =>
      Effect.gen(function* () {
        const tagResult = yield* tagInsightsCall({
          signalEntityIds: entityIds
        })
        const topTags = tagResult.tags.slice(0, 8).map((tag) => ({
          tag: tag.name || tag.id,
          score: tag.score
        }))

        const domains: QlooEntityType[] = ['artist', 'place', 'brand', 'movie']
        const affinities = []
        const evidenceRefs = [...tagResult.evidenceRefs]
        for (const domain of domains) {
          const result = yield* insightsCall({
            filterType: domain,
            signalEntityIds: entityIds
          })
          if (result.entities.length > 0) {
            affinities.push({
              domain,
              picks: result.entities.slice(0, 3).map((entity) => ({
                id: entity.id,
                name: entity.name,
                type: entity.type,
                score: entity.score ?? 0
              }))
            })
          }
        }
        return { topTags, affinities, evidenceRefs }
      }).pipe(Effect.withSpan('qloo.profileFromSignals'))

    const searchEntities = (query: string, type?: QlooEntityType) =>
      call('/search', { query, types: type ? `urn:entity:${type}` : undefined }).pipe(
        Effect.map(
          (callResult) =>
            resultsOf(callResult.json).map((entity) => ({
              id: String(entity.id ?? entity.entity_id ?? ''),
              name: String(entity.name ?? ''),
              type: shortType(entity.type, 'place'),
              tags: Array.isArray(entity.tags)
                ? (entity.tags as unknown[]).map(String)
                : undefined
            }))
        ),
        // A 404 on search means no matches, not a failure.
        Effect.catchTag('QlooNotFoundError', () => Effect.succeed([])),
        Effect.withSpan('qloo.search')
      )

    return QlooService.of({
      search: searchEntities,

      tags: (query) =>
        call('/v2/tags', { query }).pipe(
          Effect.map(
            (callResult) =>
              resultsOf(callResult.json).map((tag) => ({
                id: String(tag.id ?? tag.tag_id ?? ''),
                name: String(tag.name ?? '')
              }))
          ),
          Effect.catchTag('QlooNotFoundError', () => Effect.succeed([])),
          Effect.withSpan('qloo.tags')
        ),

      insights: (args) => insightsCall(args),

      buildProfile: (entityIds) => profileFromSignals(entityIds),

      // Resolves the niche text into REAL Qloo entity ids via /search, then
      // runs the insights pipeline on those. Invented ids 400 the call.
      buildProfileFromNiche: (niche) =>
        Effect.gen(function* () {
          const domains: QlooEntityType[] = ['artist', 'brand', 'place']
          const signalIds: string[] = []
          for (const domain of domains) {
            const hits = yield* searchEntities(niche, domain)
            for (const hit of hits.slice(0, 2)) {
              if (!signalIds.includes(hit.id)) signalIds.push(hit.id)
            }
          }
          if (signalIds.length < 2) {
            return yield* Effect.fail(new QlooNotFoundError({ query: niche }))
          }
          return yield* profileFromSignals(signalIds)
        }).pipe(Effect.withSpan('qloo.buildProfileFromNiche'))
    })
  })
)
