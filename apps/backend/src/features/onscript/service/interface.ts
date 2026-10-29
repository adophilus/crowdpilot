import { Context, type Effect } from 'effect'
import type { OnscriptNotFoundError, OnscriptServiceError } from './error'

// Platforms CrowdPilot drafts/publishes text+media posts to (the
// text+media_ids members of Onscript's PlatformPostVariant union).
export type OnscriptPlatform = 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'

export interface ConnectedAccount {
  readonly id: string
  readonly platform: string
  readonly username: string
  readonly displayName?: string
  readonly isActive: boolean
  readonly createdAt?: string
}

export interface PostVariantInput {
  readonly platform: OnscriptPlatform
  readonly text: string
  readonly mediaIds?: ReadonlyArray<string>
  readonly connectedAccountId?: string
}

export interface CreatePostArgs {
  readonly status: 'DRAFT' | 'PUBLISHING' | 'SCHEDULED'
  readonly variants: ReadonlyArray<PostVariantInput>
  // unix seconds, strictly future — required upstream when status = SCHEDULED
  readonly scheduledAt?: number
}

export interface OnscriptPost {
  readonly id: string
  readonly status: string
  readonly url?: string
  readonly platformPosts?: ReadonlyArray<PlatformPostOutcome>
}

export interface PlatformPostOutcome {
  readonly platform: string
  readonly status: string
  readonly url?: string
  readonly failureReason?: string
}

// Every call rides the shared service token from config — Onscript has no
// API-key feature, so the single service session IS the integration
// credential. Per-user ownership of connected accounts is tracked by
// CrowdPilot itself (connected_accounts table), not by Onscript.
export interface OnscriptShape {
  listConnectedAccounts: () => Effect.Effect<
    ReadonlyArray<ConnectedAccount>,
    OnscriptServiceError
  >
  createPost: (
    args: CreatePostArgs
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError>
  publishPost: (
    postId: string
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError>
  getPost: (
    postId: string
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError | OnscriptNotFoundError>
  initiateConnect: (
    platform: OnscriptPlatform
  ) => Effect.Effect<string, OnscriptServiceError>
  disconnectAccount: (
    accountId: string
  ) => Effect.Effect<void, OnscriptServiceError>
}

export class OnscriptService extends Context.Tag('OnscriptService')<
  OnscriptService,
  OnscriptShape
>() {}
