import { Context, type Effect } from 'effect'
import type { OnscriptNotFoundError, OnscriptServiceError } from './error'

// Platforms CrowdPilot drafts/publishes text+media posts to (the
// text+media_ids members of Onscript's PlatformPostVariant union).
export type OnscriptPlatform = 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'

export interface ConnectedAccount {
  readonly id: string
  readonly platform: string
  readonly username: string
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
}

export interface OnscriptPost {
  readonly id: string
  readonly status: string
  readonly url?: string
}

export interface OnscriptShape {
  listConnectedAccounts: () => Effect.Effect<
    ReadonlyArray<ConnectedAccount>,
    OnscriptServiceError
  >
  createPost: (args: CreatePostArgs) => Effect.Effect<OnscriptPost, OnscriptServiceError>
  publishPost: (postId: string) => Effect.Effect<OnscriptPost, OnscriptServiceError>
  getPost: (
    postId: string
  ) => Effect.Effect<OnscriptPost, OnscriptServiceError | OnscriptNotFoundError>
}

export class OnscriptService extends Context.Tag('OnscriptService')<
  OnscriptService,
  OnscriptShape
>() {}
