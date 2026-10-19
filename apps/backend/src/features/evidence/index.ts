import { Context, Effect, Layer, Option } from 'effect'

export interface EvidenceEntry {
  readonly refId: string
  readonly request: unknown
  readonly response: unknown
  readonly timestamp: string
}

export interface EvidenceStoreShape {
  append: (entry: {
    readonly request: unknown
    readonly response: unknown
  }) => Effect.Effect<string>
  get: (refId: string) => Effect.Effect<Option.Option<EvidenceEntry>>
}

// ponytail: in-memory and process-local — citations only need call-time refs,
// not durability. Back with Postgres if evidence must survive restarts.
export class EvidenceStore extends Context.Tag('EvidenceStore')<
  EvidenceStore,
  EvidenceStoreShape
>() {}

export const EvidenceStoreLive = Layer.effect(
  EvidenceStore,
  Effect.sync(() => {
    const entries = new Map<string, EvidenceEntry>()
    let counter = 0

    return EvidenceStore.of({
      append: (entry) =>
        Effect.sync(() => {
          const refId = `ev_${String(++counter).padStart(4, '0')}`
          entries.set(refId, {
            refId,
            request: entry.request,
            response: entry.response,
            timestamp: new Date().toISOString()
          })
          return refId
        }),
      get: (refId) => Effect.sync(() => Option.fromNullable(entries.get(refId)))
    })
  })
)
