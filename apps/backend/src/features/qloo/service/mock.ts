import { Effect, Layer } from 'effect'
import { EvidenceStore } from '@/features/evidence'
import { QlooNotFoundError } from './error'
import {
  QlooService,
  type QlooEntityType,
  type QlooInsightsArgs,
  type QlooInsightsResult,
  type QlooProfileCard
} from './interface'

type PersonaId = 'lagos' | 'nyc'

interface FixtureEntity {
  readonly id: string
  readonly name: string
  readonly type: QlooEntityType
  readonly persona: PersonaId
  readonly tags: ReadonlyArray<string>
}

// Two personas: "Kofi's café in Lagos" (amapiano/afrobeats crowd, specialty
// coffee, jollof-adjacent dining, Lagos places) + NYC coffee bar fallback.
// Ids mirror Qloo's urn:entity:* scheme so swapping live is zero-code.
const ENTITIES: ReadonlyArray<FixtureEntity> = [
  // Lagos café crowd
  { id: 'urn:entity:artist:burna-boy', name: 'Burna Boy', type: 'artist', persona: 'lagos', tags: ['urn:tag:genre:artist:afrobeats'] },
  { id: 'urn:entity:artist:kabza-de-small', name: 'Kabza De Small', type: 'artist', persona: 'lagos', tags: ['urn:tag:genre:artist:amapiano'] },
  { id: 'urn:entity:artist:fela-kuti', name: 'Fela Kuti', type: 'artist', persona: 'lagos', tags: ['urn:tag:genre:artist:afrobeats', 'urn:tag:genre:artist:highlife'] },
  { id: 'urn:entity:artist:asake', name: 'Asake', type: 'artist', persona: 'lagos', tags: ['urn:tag:genre:artist:afrobeats', 'urn:tag:genre:artist:amapiano'] },
  { id: 'urn:entity:place:terra-kulture', name: 'Terra Kulture', type: 'place', persona: 'lagos', tags: ['urn:tag:cuisine:restaurant:west-african'] },
  { id: 'urn:entity:place:nike-art-gallery', name: 'Nike Art Gallery', type: 'place', persona: 'lagos', tags: [] },
  { id: 'urn:entity:place:landmark-beach', name: 'Landmark Beach', type: 'place', persona: 'lagos', tags: [] },
  { id: 'urn:entity:brand:cafe-neo', name: 'Café Neo', type: 'brand', persona: 'lagos', tags: ['urn:tag:category:place:coffee-shops'] },
  { id: 'urn:entity:movie:lionheart', name: 'Lionheart', type: 'movie', persona: 'lagos', tags: [] },

  // NYC coffee bar fallback crowd
  { id: 'urn:entity:artist:vampire-weekend', name: 'Vampire Weekend', type: 'artist', persona: 'nyc', tags: ['urn:tag:genre:artist:indie-rock'] },
  { id: 'urn:entity:artist:norah-jones', name: 'Norah Jones', type: 'artist', persona: 'nyc', tags: [] },
  { id: 'urn:entity:place:dominique-ansel-bakery', name: 'Dominique Ansel Bakery', type: 'place', persona: 'nyc', tags: ['urn:tag:category:place:coffee-shops'] },
  { id: 'urn:entity:place:the-high-line', name: 'The High Line', type: 'place', persona: 'nyc', tags: [] },
  { id: 'urn:entity:brand:blue-bottle-coffee', name: 'Blue Bottle Coffee', type: 'brand', persona: 'nyc', tags: ['urn:tag:category:place:coffee-shops'] },
  { id: 'urn:entity:brand:intelligentsia', name: 'Intelligentsia Coffee', type: 'brand', persona: 'nyc', tags: ['urn:tag:category:place:coffee-shops'] },
  { id: 'urn:entity:movie:her', name: 'Her', type: 'movie', persona: 'nyc', tags: [] }
]

const TAGS: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'urn:tag:genre:artist:afrobeats', name: 'afrobeats' },
  { id: 'urn:tag:genre:artist:amapiano', name: 'amapiano' },
  { id: 'urn:tag:genre:artist:highlife', name: 'highlife' },
  { id: 'urn:tag:genre:artist:indie-rock', name: 'indie rock' },
  { id: 'urn:tag:cuisine:restaurant:west-african', name: 'west african' },
  { id: 'urn:tag:category:place:coffee-shops', name: 'coffee shops' }
]

// Curated affinity tables — realistic 0.0–1.0 score distributions per persona.
const AFFINITIES: Record<
  PersonaId,
  Partial<Record<QlooEntityType, ReadonlyArray<readonly [string, number]>>>
> = {
  lagos: {
    artist: [
      ['urn:entity:artist:burna-boy', 0.95],
      ['urn:entity:artist:kabza-de-small', 0.91],
      ['urn:entity:artist:fela-kuti', 0.88],
      ['urn:entity:artist:asake', 0.84]
    ],
    place: [
      ['urn:entity:place:terra-kulture', 0.9],
      ['urn:entity:place:nike-art-gallery', 0.85],
      ['urn:entity:place:landmark-beach', 0.82]
    ],
    brand: [['urn:entity:brand:cafe-neo', 0.88]],
    movie: [['urn:entity:movie:lionheart', 0.9]]
  },
  nyc: {
    artist: [
      ['urn:entity:artist:vampire-weekend', 0.92],
      ['urn:entity:artist:norah-jones', 0.86]
    ],
    place: [
      ['urn:entity:place:dominique-ansel-bakery', 0.9],
      ['urn:entity:place:the-high-line', 0.84]
    ],
    brand: [
      ['urn:entity:brand:blue-bottle-coffee', 0.91],
      ['urn:entity:brand:intelligentsia', 0.85]
    ],
    movie: [['urn:entity:movie:her', 0.87]]
  }
}

const PROFILE_DOMAINS: ReadonlyArray<QlooEntityType> = [
  'artist',
  'place',
  'brand',
  'movie'
]

const byId = new Map(ENTITIES.map((entity) => [entity.id, entity]))

const round2 = (n: number) => Math.round(n * 100) / 100

// Deterministic fallback score (0.30–0.59) for entities outside curated tables.
const hash01 = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return h / 997
}

const tableScore = (
  entity: FixtureEntity,
  personas: ReadonlyArray<PersonaId>
): number | undefined => {
  let best: number | undefined
  for (const persona of personas) {
    const hit = AFFINITIES[persona][entity.type]?.find(
      ([id]) => id === entity.id
    )
    if (hit && (best === undefined || hit[1] > best)) best = hit[1]
  }
  return best
}

const scoreOf = (
  entity: FixtureEntity,
  personas: ReadonlyArray<PersonaId>,
  boosts: ReadonlySet<string>
) => {
  const base = tableScore(entity, personas) ?? round2(0.3 + hash01(entity.id) * 0.29)
  const boosted = entity.tags.some((tag) => boosts.has(tag)) ? base + 0.05 : base
  return round2(Math.min(0.99, boosted))
}

const personasOf = (entityIds: ReadonlyArray<string>): ReadonlyArray<PersonaId> => {
  const found = new Set<PersonaId>()
  for (const id of entityIds) {
    const entity = byId.get(id)
    if (entity) found.add(entity.persona)
  }
  return [...found]
}

export const QlooServiceMockLive = Layer.effect(
  QlooService,
  Effect.gen(function* () {
    const evidence = yield* EvidenceStore

    const record = (
      endpoint: string,
      params: Record<string, unknown>,
      response: unknown
    ) => evidence.append({ request: { endpoint, params }, response })

    const insightsImpl = (
      args: QlooInsightsArgs
    ): Effect.Effect<QlooInsightsResult, QlooNotFoundError> =>
      Effect.gen(function* () {
        for (const id of args.signalEntityIds ?? []) {
          if (!byId.has(id)) {
            return yield* Effect.fail(new QlooNotFoundError({ entityId: id }))
          }
        }

        // No signal entities -> blend both personas.
        const personas = personasOf(args.signalEntityIds ?? []).length
          ? personasOf(args.signalEntityIds ?? [])
          : (['lagos', 'nyc'] as const)
        const boosts = new Set([...(args.signalTagIds ?? []), ...(args.tags ?? [])])
        const exclude = new Set(args.signalEntityIds ?? [])

        const entities = ENTITIES.filter(
          (entity) => entity.type === args.filterType && !exclude.has(entity.id)
        )
          .map((entity) => ({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            tags: entity.tags,
            score: scoreOf(entity, personas, boosts)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)

        const refId = yield* record(
          'insights',
          {
            'filter.type': args.filterType,
            'signal.interests.entities': args.signalEntityIds?.join(','),
            'signal.interests.tags': args.signalTagIds?.join(','),
            'location.query': args.locationNear,
            tags: args.tags?.join(',')
          },
          { results: { entities } }
        )
        return { entities, evidenceRefs: [refId] }
      }).pipe(Effect.withSpan('qloo.insights'))

    // Tag affinity: frequency of each fixture tag across the signal
    // entities, normalized to a 0.55–0.95 score band.
    const profileFromIds = (
      entityIds: readonly string[]
    ): Effect.Effect<QlooProfileCard, QlooNotFoundError> =>
      Effect.gen(function* () {
        for (const id of entityIds) {
          if (!byId.has(id)) {
            return yield* Effect.fail(new QlooNotFoundError({ entityId: id }))
          }
        }
        const counts = new Map<string, number>()
        for (const id of entityIds) {
          for (const tag of byId.get(id)?.tags ?? []) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1)
          }
        }
        const max = Math.max(1, ...counts.values())
        const topTags = [...counts.entries()]
          .map(([tag, count]) => ({
            tag: TAGS.find((t) => t.id === tag)?.name ?? tag,
            score: round2(0.55 + (0.4 * count) / max)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)

        const affinities = []
        const evidenceRefs: string[] = []
        for (const domain of PROFILE_DOMAINS) {
          const result = yield* insightsImpl({
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
          evidenceRefs.push(...result.evidenceRefs)
        }

        return { topTags, affinities, evidenceRefs }
      }).pipe(Effect.withSpan('qloo.profileFromIds'))

    return QlooService.of({
      search: (query, type) =>
        Effect.gen(function* () {
          const q = query.trim().toLowerCase()
          const results = ENTITIES.filter(
            (entity) =>
              (type === undefined || entity.type === type) &&
              (q === '' || entity.name.toLowerCase().includes(q))
          ).map(({ id, name, type, tags }) => ({ id, name, type, tags }))
          yield* record('search', { query, types: type }, { results })
          return results
        }).pipe(Effect.withSpan('qloo.search')),

      tags: (query) =>
        Effect.gen(function* () {
          const q = query.trim().toLowerCase()
          const results = TAGS.filter((tag) => tag.name.toLowerCase().includes(q))
          yield* record('tags', { query }, { results })
          return results
        }).pipe(Effect.withSpan('qloo.tags')),

      insights: (args) => insightsImpl(args),

      buildProfile: (entityIds) => profileFromIds(entityIds),

      buildProfileFromNiche: (niche) =>
        Effect.gen(function* () {
          const q = niche.trim().toLowerCase()
          const words = q.split(/\s+/).filter((w) => w.length > 2)
          const ids = ENTITIES.filter((entity) =>
            words.some((w) => entity.name.toLowerCase().includes(w))
          ).map((entity) => entity.id)
          if (ids.length < 2) {
            return yield* Effect.fail(
              new QlooNotFoundError({ query: niche })
            )
          }
          return yield* profileFromIds(ids)
        }).pipe(Effect.withSpan('qloo.buildProfileFromNiche'))
    })
  })
)
