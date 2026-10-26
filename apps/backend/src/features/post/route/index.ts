import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import BadRequestError from '@crowdpilot/api/common/BadRequestError'
import NotFoundError from '@crowdpilot/api/common/NotFoundError'
import OnscriptError from '@crowdpilot/api/common/OnscriptError'
import PlanLimitError from '@crowdpilot/api/common/PlanLimitError'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import {
  CreatePostSuccess,
  PostDetailSuccess,
  PostsListSuccess,
  PostSummary,
  PublishSuccess
} from '@crowdpilot/api/Posts/index'
import { Sql } from '@crowdpilot/sql'
import {
  OnscriptService,
  OnscriptServiceError,
  type OnscriptPlatform
} from '../../onscript/service'

const toOnscriptApiError = (
  error: OnscriptServiceError
): Effect.Effect<never, OnscriptError> =>
  Effect.fail(new OnscriptError({ message: String(error.cause) }))

export const PostApiLive = HttpApiBuilder.group(Api, 'Posts', (handlers) =>
  Effect.gen(function* () {
    const onscript = yield* OnscriptService
    const sql = yield* Sql

    const tokenFor = (userId: string) =>
      Effect.map(
        Effect.tryPromise({
          try: () =>
            sql
              .selectFrom('onscript_sessions')
              .where('user_id', '=', userId)
              .selectAll()
              .executeTakeFirst(),
          catch: (cause) => new OnscriptError({ message: String(cause) })
        }),
        (row) => row?.access_token ?? null
      )

    // Maps upstream failure to the contract errors: 402 -> PlanLimitError,
    // other Onscript failures -> OnscriptError(502).
    const mapCreateError = (
      error: OnscriptServiceError
    ): Effect.Effect<never, PlanLimitError | OnscriptError> =>
      error.status === 402
        ? Effect.fail(new PlanLimitError({ limitType: 'post' }))
        : Effect.fail(new OnscriptError({ message: String(error.cause) }))

    const postRow = (postId: string, userId: string) =>
      Effect.flatMap(
        Effect.tryPromise({
          try: () =>
            sql
              .selectFrom('posts')
              .where('id', '=', postId)
              .where('user_id', '=', userId)
              .selectAll()
              .executeTakeFirst(),
          catch: (cause) => new OnscriptError({ message: String(cause) })
        }),
        (row) => {
          if (!row) {
            return Effect.fail(
              new NotFoundError({ message: `Unknown post ${postId}` })
            )
          }
          return Effect.succeed(row)
        }
      )

    return handlers
      .handle('listPosts', () =>
        Effect.flatMap(CurrentUser, (user) =>
          Effect.flatMap(
            Effect.tryPromise({
              try: () =>
                sql
                  .selectFrom('posts')
                  .where('user_id', '=', user.id)
                  .orderBy('created_at', 'desc')
                  .selectAll()
                  .execute(),
              catch: (cause) => new OnscriptError({ message: String(cause) })
            }),
            (rows) =>
              Effect.succeed(
                PostsListSuccess.make({
                  posts: rows.map((row) =>
                    PostSummary.make({
                      id: row.id,
                      onscriptPostId: row.onscript_post_id,
                      text: row.text,
                      platforms: [...row.platforms] as [
                        'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'
                      ],
                      status: row.status,
                      ...(row.permalink ? { permalink: row.permalink } : {}),
                      createdAt: row.created_at.toISOString()
                    })
                  )
                })
              )
          )
        )
      )
      .handle('createPost', ({ payload }) =>
        Effect.flatMap(CurrentUser, (user) =>
          Effect.flatMap(tokenFor(user.id), (token) =>
            onscript.listConnectedAccounts({ token }).pipe(
              Effect.flatMap((accounts) => {
                const variants = payload.platforms.map((platform) => {
                  const account = accounts.find(
                    (candidate) =>
                      candidate.platform === platform && candidate.isActive
                  )
                  if (!account) {
                    return Effect.fail(
                      new BadRequestError({
                        message: `No active ${platform} account connected`
                      })
                    )
                  }
                  return Effect.succeed({
                    platform: platform as OnscriptPlatform,
                    text: payload.text,
                    connectedAccountId: account.id
                  })
                })

                return Effect.flatMap(
                  Effect.all(variants, { discard: false }),
                  (resolved) => {
                    const status = payload.scheduledAt
                      ? ('SCHEDULED' as const)
                      : payload.publishNow === false
                        ? ('DRAFT' as const)
                        : ('PUBLISHING' as const)

                    return onscript
                      .createPost(
                        {
                          status,
                          variants: resolved,
                          ...(status === 'SCHEDULED' &&
                          payload.scheduledAt !== undefined
                            ? { scheduledAt: payload.scheduledAt }
                            : {})
                        },
                        { token }
                      )
                      .pipe(
                        Effect.flatMap((post) =>
                          Effect.flatMap(
                            Effect.tryPromise({
                              try: () =>
                                sql
                                  .insertInto('posts')
                                  .values({
                                    user_id: user.id,
                                    onscript_post_id: post.id,
                                    text: payload.text,
                                    platforms: [...payload.platforms],
                                    // Onscript's 202 create response carries only {id};
                                    // the intended status is what we asked for.
                                    status
                                  })
                                  .returningAll()
                                  .executeTakeFirstOrThrow(),
                              catch: (cause) =>
                                new OnscriptError({ message: String(cause) })
                            }),
                            (row) =>
                              Effect.succeed(
                                CreatePostSuccess.make({
                                  id: row.id,
                                  onscriptPostId: row.onscript_post_id,
                                  status
                                })
                              )
                          )
                        ),
                        Effect.catchTag(
                          'OnscriptServiceError',
                          mapCreateError
                        )
                      )
                  }
                )
              }),
              Effect.catchTag('OnscriptServiceError', toOnscriptApiError)
            )
          )
        )
      )
      .handle('publishPost', ({ path }) =>
        Effect.flatMap(CurrentUser, (user) =>
          Effect.flatMap(postRow(path.id, user.id), (row) =>
            Effect.flatMap(tokenFor(user.id), (token) =>
              onscript.publishPost(row.onscript_post_id, { token }).pipe(
                Effect.flatMap((post) =>
                  Effect.flatMap(
                    Effect.tryPromise({
                      try: () =>
                        sql
                          .updateTable('posts')
                          // publish response is 202 {id} only — it means "now publishing"
                          .set({ status: 'PUBLISHING' })
                          .where('id', '=', row.id)
                          .execute(),
                      catch: (cause) =>
                        new OnscriptError({ message: String(cause) })
                    }),
                    () =>
                      Effect.succeed(
                        PublishSuccess.make({
                          id: row.id,
                          status: 'PUBLISHING'
                        })
                      )
                  )
                ),
                Effect.catchTag('OnscriptServiceError', toOnscriptApiError)
              )
            )
          )
        )
      )
      .handle('getPost', ({ path }) =>
        Effect.flatMap(CurrentUser, (user) =>
          Effect.flatMap(postRow(path.id, user.id), (row) =>
            Effect.flatMap(tokenFor(user.id), (token) =>
              onscript.getPost(row.onscript_post_id, { token }).pipe(
                Effect.flatMap((post) =>
                  Effect.flatMap(
                    Effect.tryPromise({
                      try: () =>
                        sql
                          .updateTable('posts')
                          .set({
                            status: post.status,
                            ...(post.url ? { permalink: post.url } : {})
                          })
                          .where('id', '=', row.id)
                          .execute(),
                      catch: (cause) =>
                        new OnscriptError({ message: String(cause) })
                    }),
                    () =>
                      Effect.succeed(
                        PostDetailSuccess.make({
                          id: row.id,
                          status: post.status,
                          ...(post.url ? { permalink: post.url } : {}),
                          perPlatform: (post.platformPosts ?? []).map(
                            (outcome) => ({
                              platform: outcome.platform as
                                | 'TWITTER'
                                | 'FACEBOOK'
                                | 'INSTAGRAM',
                              status: outcome.status,
                              ...(outcome.url ? { url: outcome.url } : {}),
                              ...(outcome.failureReason
                                ? { failureReason: outcome.failureReason }
                                : {})
                            })
                          )
                        })
                      )
                  )
                ),
                Effect.catchTags({
                  OnscriptNotFoundError: () =>
                    Effect.fail(
                      new NotFoundError({
                        message: 'Post no longer exists on Onscript'
                      })
                    ),
                  OnscriptServiceError: toOnscriptApiError
                })
              )
            )
          )
        )
      )
  })
)
