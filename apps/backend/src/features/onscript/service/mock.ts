import { Effect, Layer } from 'effect'
import { EvidenceStore } from '@/features/evidence'
import { OnscriptNotFoundError, OnscriptServiceError } from './error'
import {
  OnscriptService,
  type CreatePostArgs,
  type OnscriptPlatform,
  type OnscriptPost,
  type OnscriptUser,
  type TokenContext
} from './interface'

// Single deterministic fixture: the demo persona's X account.
const ACCOUNT = {
  id: 'acct_crowdpilot_demo_x',
  platform: 'TWITTER',
  username: 'crowdpilot-demo',
  isActive: true
} as const

const permalink = (n: number) =>
  `https://x.com/${ACCOUNT.username}/status/${1899000000000000000n + BigInt(n)}`

export const OnscriptServiceMockLive = Layer.effect(
  OnscriptService,
  Effect.gen(function* () {
    const evidence = yield* EvidenceStore
    const posts = new Map<string, OnscriptPost>()
    let counter = 0

    const record = (endpoint: string, params: unknown, response: unknown) =>
      evidence.append({ request: { endpoint, params }, response })

    return OnscriptService.of({
      listConnectedAccounts: (_ctx?: TokenContext) =>
        Effect.gen(function* () {
          yield* record('listConnectedAccounts', {}, { data: [ACCOUNT] })
          return [{ ...ACCOUNT }]
        }).pipe(Effect.withSpan('onscript.listConnectedAccounts')),

      createPost: (args: CreatePostArgs, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          const id = `post_mock_${String(++counter).padStart(3, '0')}`
          const post: OnscriptPost = { id, status: args.status }
          posts.set(id, post)
          yield* record('createPost', args, post)
          return post
        }).pipe(Effect.withSpan('onscript.createPost')),

      publishPost: (postId, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          const stored = posts.get(postId)
          if (!stored) {
            return yield* Effect.fail(
              new OnscriptServiceError({ cause: `mock: unknown post ${postId}` })
            )
          }
          const published: OnscriptPost = {
            ...stored,
            status: 'PUBLISHED',
            url: permalink(counter)
          }
          posts.set(postId, published)
          yield* record('publishPost', { postId }, published)
          return published
        }).pipe(Effect.withSpan('onscript.publishPost')),

      getPost: (postId, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          const stored = posts.get(postId)
          if (!stored) {
            return yield* Effect.fail(new OnscriptNotFoundError({ postId }))
          }
          yield* record('getPost', { postId }, stored)
          return stored
        }).pipe(Effect.withSpan('onscript.getPost')),

      sendSignInOtp: (_email: string, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          yield* record('sendSignInOtp', {}, {})
        }).pipe(Effect.withSpan('onscript.sendSignInOtp')),

      verifyOtp: (email: string, _otp: string, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          const user: OnscriptUser = { token: 'mock_onscript_token', email }
          yield* record('verifyOtp', { email }, user)
          return user
        }).pipe(Effect.withSpan('onscript.verifyOtp')),

      initiateConnect: (platform: OnscriptPlatform, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          const authUrl = `https://onscript.test/oauth/${platform.toLowerCase()}`
          yield* record('initiateConnect', { platform }, { auth_url: authUrl })
          return authUrl
        }).pipe(Effect.withSpan('onscript.initiateConnect')),

      disconnectAccount: (accountId: string, _ctx?: TokenContext) =>
        Effect.gen(function* () {
          yield* record('disconnectAccount', { accountId }, {})
        }).pipe(Effect.withSpan('onscript.disconnectAccount'))
    })
  })
)
