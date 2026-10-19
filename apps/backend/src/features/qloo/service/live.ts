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

    // Internal variant: Qloo's filter.type=tag returns audience tags.
    type InsightsArgs = Omit<QlooInsightsArgs, 'filterType'> & {
      filterType: QlooEntityType | 'tag'
    }

    const insightsCall = (args: InsightsArgs) =>
      call('/v2/insights', {
        'filter.type': args.filterType,
        'signal.interests.entities': args.signalEntityIds?.join(','),
        'signal.interests.tags': args.signalTagIds?.join(','),
        'location.query': args.locationNear,
        tags: args.tags?.join(',')
      }).pipe(
        Effect.map((jsonAndRef): QlooInsightsResult => {
          // Empty entities is a normal result, not an error.
          const json = jsonAndRef.json
          const wireEntities =
            (json as { results?: { entities?: Array<Record<string, unknown>> } })
              ?.results?.entities ?? []
          const entities = wireEntities.map((entity, index) => ({
            id: String(entity.id ?? entity.entity_id ?? ''),
            name: String(entity.name ?? ''),
            type: shortType(
              entity.type,
              args.filterType === 'tag' ? 'place' : args.filterType
            ),
            score:
              typeof entity.score === 'number'
                ? entity.score
                : typeof (entity.properties as { affinity?: unknown } | undefined)
                      ?.affinity === 'number'
                  ? (entity.properties as { affinity: number }).affinity
                  : Math.round((1 - index * 0.05) * 100) / 100,
            tags: Array.isArray(entity.tags)
              ? (entity.tags as unknown[]).map(String)
              : undefined
          }))
          return { entities, evidenceRefs: [jsonAndRef.refId] }
        }),
        Effect.withSpan('qloo.insights')
      )

    return QlooService.of({
      search: (query, type) =>
        call('/search', { query, types: type }).pipe(
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
        ),

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

      buildProfile: (entityIds, tagIds) =>
        Effect.gen(function* () {
          // filter.type=tag returns audience tags for the signal entities.
          const tagResult = yield* insightsCall({
            filterType: 'tag',
            signalEntityIds: entityIds,
            signalTagIds: tagIds
          })
          const topTags = tagResult.entities.slice(0, 8).map((entity) => ({
            tag: entity.name || entity.id,
            score: entity.score ?? 0
          }))

          const domains: QlooEntityType[] = [
            'artist',
            'place',
            'brand',
            'movie'
          ]
          const affinities = []
          const evidenceRefs = [...tagResult.evidenceRefs]
          for (const domain of domains) {
            const result = yield* insightsCall({
              filterType: domain,
              signalEntityIds: entityIds,
              signalTagIds: tagIds
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
        }).pipe(Effect.withSpan('qloo.buildProfile'))
    })
  })
)
