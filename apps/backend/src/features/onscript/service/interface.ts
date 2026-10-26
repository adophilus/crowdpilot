import { Context, type Effect } from 'effect'
import type { OnscriptNotFoundError, OnscriptServiceError } from './error'

// Platforms CrowdPilot drafts/publishes text+media posts to (the
// text+media_ids members of Onscript's PlatformPostVariant union).
export type OnscriptPlatform = 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'

// Token resolution context: a user-linked Onscript token, or null/omitted
// for the shared CrowdPilot service account (chat agent calls).
export interface TokenContext {
  readonly token?: string | null
}

export interface ConnectedAccount {
  readonly id: string
  readonly platform: string
  readonly username: string
  readonly displayName?: string
  readonly isActive: boolean
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

export interface OnscriptUser {
  readonly token: string
  readonly email: string
}

export interface OnscriptShape {
  listConnectedAccounts: (
    ctx?: TokenContext
  ) => Effect.Effect<ReadonlyArray<ConnectedAccount>, OnscriptServiceError>
  createPost: (
    args: CreatePostArgs,
    ctx?: TokenContext
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError>
  publishPost: (
    postId: string,
    ctx?: TokenContext
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError>
  getPost: (
    postId: string,
    ctx?: TokenContext
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError | OnscriptNotFoundError>
  sendSignInOtp: (
    email: string,
    ctx?: TokenContext
  ) => Effect.Effect<void, OnscriptServiceError>
  verifyOtp: (
    email: string,
    otp: string,
    ctx?: TokenContext
  ) => Effect.Effect<OnscriptUser, OnscriptServiceError>
  initiateConnect: (
    platform: OnscriptPlatform,
    ctx?: TokenContext
  ) => Effect.Effect<string, OnscriptServiceError>
  disconnectAccount: (
    accountId: string,
    ctx?: TokenContext
  ) => Effect.Effect<void, OnscriptServiceError>
}

export class OnscriptService extends Context.Tag('OnscriptService')<
  OnscriptService,
  OnscriptShape
>() {}
