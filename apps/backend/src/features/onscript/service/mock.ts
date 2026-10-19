import { Effect, Layer } from 'effect'
import { EvidenceStore } from '@/features/evidence'
import { OnscriptNotFoundError, OnscriptServiceError } from './error'
import {
  OnscriptService,
  type CreatePostArgs,
  type OnscriptPost
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
      listConnectedAccounts: () =>
        Effect.gen(function* () {
          yield* record('listConnectedAccounts', {}, { data: [ACCOUNT] })
          return [{ ...ACCOUNT }]
        }).pipe(Effect.withSpan('onscript.listConnectedAccounts')),

      createPost: (args: CreatePostArgs) =>
        Effect.gen(function* () {
          const id = `post_mock_${String(++counter).padStart(3, '0')}`
          const post: OnscriptPost = { id, status: args.status }
          posts.set(id, post)
          yield* record('createPost', args, post)
          return post
        }).pipe(Effect.withSpan('onscript.createPost')),

      publishPost: (postId) =>
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

      getPost: (postId) =>
        Effect.gen(function* () {
          const stored = posts.get(postId)
          if (!stored) {
            return yield* Effect.fail(new OnscriptNotFoundError({ postId }))
          }
          yield* record('getPost', { postId }, stored)
          return stored
        }).pipe(Effect.withSpan('onscript.getPost'))
    })
  })
)
