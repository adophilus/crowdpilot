import { Context, type Effect } from 'effect'
import type { QlooNotFoundError, QlooServiceError } from './error'

// Short-form entity types per Qloo's filter.type whitelist
// (wire values are `urn:entity:<type>`; services normalize to these).
export type QlooEntityType =
  | 'artist'
  | 'brand'
  | 'place'
  | 'movie'
  | 'tv_show'
  | 'book'
  | 'podcast'
  | 'video_game'
  | 'destination'
  | 'person'

export interface QlooEntity {
  readonly id: string
  readonly name: string
  readonly type: QlooEntityType
  readonly score?: number
  readonly tags?: ReadonlyArray<string>
}

export interface QlooTag {
  readonly id: string
  readonly name: string
}

export interface QlooInsightsArgs {
  readonly filterType: QlooEntityType
  readonly signalEntityIds?: ReadonlyArray<string> | undefined
  readonly signalTagIds?: ReadonlyArray<string> | undefined
  readonly locationNear?: string | undefined
  readonly tags?: ReadonlyArray<string> | undefined
}

export interface QlooInsightsResult {
  readonly entities: ReadonlyArray<QlooEntity>
  readonly evidenceRefs: ReadonlyArray<string>
}

export interface QlooAffinity {
  readonly domain: QlooEntityType
  readonly picks: ReadonlyArray<{
    readonly id: string
    readonly name: string
    readonly type: QlooEntityType
    readonly score: number
  }>
}

export interface QlooProfileCard {
  readonly topTags: ReadonlyArray<{ readonly tag: string; readonly score: number }>
  readonly affinities: ReadonlyArray<QlooAffinity>
  readonly evidenceRefs: ReadonlyArray<string>
}

export interface QlooShape {
  search: (
    query: string,
    type?: QlooEntityType
  ) => Effect.Effect<ReadonlyArray<QlooEntity>, QlooServiceError>
  tags: (query: string) => Effect.Effect<ReadonlyArray<QlooTag>, QlooServiceError>
  insights: (args: QlooInsightsArgs) => Effect.Effect<
    QlooInsightsResult,
    QlooServiceError | QlooNotFoundError
  >
  buildProfile: (
    entityIds: ReadonlyArray<string>,
    tagIds?: ReadonlyArray<string>
  ) => Effect.Effect<QlooProfileCard, QlooServiceError | QlooNotFoundError>
  buildProfileFromNiche: (
    niche: string
  ) => Effect.Effect<QlooProfileCard, QlooServiceError | QlooNotFoundError>
}

export class QlooService extends Context.Tag('QlooService')<
  QlooService,
  QlooShape
>() {}
