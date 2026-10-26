import { Effect, Layer } from 'effect'
import { AppConfig } from '@/features/config'
import { EvidenceStore } from '@/features/evidence'
import {
  OnscriptNotFoundError,
  OnscriptServiceError
} from './error'
import {
  OnscriptService,
  type ConnectedAccount,
  type CreatePostArgs,
  type OnscriptPlatform,
  type OnscriptPost,
  type OnscriptUser,
  type PlatformPostOutcome,
  type TokenContext
} from './interface'

const firstPermalink = (posts: unknown): string | undefined => {
  if (!Array.isArray(posts)) return undefined
  for (const row of posts) {
    const url = (row as { url?: unknown } | null)?.url
    if (typeof url === 'string' && url.length > 0) return url
  }
  return undefined
}

// meta.failure_reason is a tagged shape ({RATE_LIMITED:{retry_after}} etc.)
// or a plain string — reduce both to one human-readable line.
const failureReasonOf = (meta: unknown): string | undefined => {
  const reason = (meta as { failure_reason?: unknown } | null)?.failure_reason
  if (reason === undefined || reason === null) return undefined
  if (typeof reason === 'string') return reason || undefined
  const message = (reason as { message?: unknown }).message
  if (typeof message === 'string' && message.length > 0) return message
  const tag = (reason as { _tag?: unknown })._tag
  return typeof tag === 'string' ? tag : JSON.stringify(reason)
}

const platformPostOf = (row: unknown): PlatformPostOutcome | null => {
  const post = (row ?? {}) as {
    platform?: unknown
    status?: unknown
    url?: unknown
    meta?: unknown
  }
  const platform = post.platform
  if (typeof platform !== 'string' || platform === '') return null
  return {
    platform: platform.toUpperCase(),
    status: typeof post.status === 'string' ? post.status : 'UNKNOWN',
    url:
      typeof post.url === 'string' && post.url.length > 0
        ? post.url
        : undefined,
    failureReason: failureReasonOf(post.meta)
  }
}

const postOf = (json: unknown): OnscriptPost => {
  const body = (json ?? {}) as {
    id?: unknown
    status?: unknown
    url?: unknown
    platform_posts?: unknown
  }
  const directUrl =
    typeof body.url === 'string' && body.url.length > 0 ? body.url : undefined
  const platformPosts = Array.isArray(body.platform_posts)
    ? body.platform_posts
        .map(platformPostOf)
        .filter((row): row is PlatformPostOutcome => row !== null)
    : undefined
  return {
    id: String(body.id ?? ''),
    status: typeof body.status === 'string' ? body.status : 'UNKNOWN',
    url: directUrl ?? firstPermalink(body.platform_posts),
    ...(platformPosts && platformPosts.length > 0 ? { platformPosts } : {})
  }
}

export const OnscriptServiceLive = Layer.effect(
  OnscriptService,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const evidence = yield* EvidenceStore
    const baseUrl = config.onscript.baseUrl.replace(/\/$/, '')

    const call = Effect.fnUntraced(function* (
      method: 'GET' | 'POST' | 'DELETE',
      path: string,
      payload: unknown,
      token?: string | null
    ) {
      const url = `${baseUrl}${path}`
      const bearer = token ?? config.onscript.sessionToken
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${bearer}`,
              Accept: 'application/json',
              ...(payload === undefined
                ? {}
                : { 'Content-Type': 'application/json' })
            },
            body: payload === undefined ? undefined : JSON.stringify(payload)
          })
          const json = await response.json().catch(() => undefined)
          return { ok: response.ok, status: response.status, json }
        },
        catch: (cause) => new OnscriptServiceError({ cause })
      })

      // Bearer token stays in the header — never logged or stored.
      const refId = yield* evidence.append({
        request: { method, url, body: payload },
        response: result.json
      })
      yield* Effect.logDebug(
        `[onscript] ${method} ${path} -> ${result.status} (evidence ${refId})`
      )

      if (!result.ok) {
        return yield* Effect.fail(
          new OnscriptServiceError({
            cause: `Onscript responded ${result.status}: ${JSON.stringify(result.json)}`,
            status: result.status
          })
        )
      }
      return result.json
    })

    return OnscriptService.of({
      listConnectedAccounts: (ctx) =>
        call('GET', '/integrations/connected-accounts', undefined, ctx?.token).pipe(
          Effect.map((json): ReadonlyArray<ConnectedAccount> => {
            const data = (json as { data?: unknown } | null)?.data
            if (!Array.isArray(data)) return []
            return data
              .map((row) => {
                const account = (row ?? {}) as {
                  id?: unknown
                  platform?: unknown
                  platform_username?: unknown
                  platform_display_name?: unknown
                  is_active?: unknown
                }
                const displayName = account.platform_display_name
                return {
                  id: String(account.id ?? ''),
                  platform: String(account.platform ?? '').toUpperCase(),
                  username: String(account.platform_username ?? ''),
                  ...(typeof displayName === 'string' && displayName.length > 0
                    ? { displayName }
                    : {}),
                  isActive: account.is_active !== false
                }
              })
              .filter((account) => account.id !== '')
          }),
          Effect.withSpan('onscript.listConnectedAccounts')
        ),

      createPost: (args: CreatePostArgs, ctx) =>
        call(
          'POST',
          '/posts',
          {
            status: args.status,
            ...(args.scheduledAt !== undefined
              ? { scheduled_at: args.scheduledAt }
              : {}),
            platforms: args.variants.map((variant) => ({
              platform: variant.platform,
              ...(variant.connectedAccountId
                ? { connected_account_id: variant.connectedAccountId }
                : {}),
              text: variant.text,
              media_ids: variant.mediaIds ? [...variant.mediaIds] : []
            }))
          },
          ctx?.token
        ).pipe(
          Effect.map(postOf),
          Effect.withSpan('onscript.createPost')
        ),

      publishPost: (postId, ctx) =>
        // Empty object, not no-body — the API rejects a null payload.
        call(
          'POST',
          `/posts/${encodeURIComponent(postId)}/publish`,
          {},
          ctx?.token
        ).pipe(
          Effect.map(postOf),
          Effect.withSpan('onscript.publishPost')
        ),

      getPost: (postId, ctx) =>
        call('GET', `/posts/${encodeURIComponent(postId)}`, undefined, ctx?.token).pipe(
          Effect.map(postOf),
          Effect.catchTag(
            'OnscriptServiceError',
            (
              error
            ): Effect.Effect<
              OnscriptPost,
              OnscriptServiceError | OnscriptNotFoundError
            > => {
              const message = String(error.cause)
              return message.includes(' 404')
                ? Effect.fail(new OnscriptNotFoundError({ postId }))
                : Effect.fail(error)
            }
          ),
          Effect.withSpan('onscript.getPost')
        ),

      sendSignInOtp: (email, ctx) =>
        call(
          'POST',
          '/auth/sign-in/strategy/email',
          { email },
          ctx?.token
        ).pipe(
          // An unexpired OTP already in flight is fine — the inbox still has
          // a usable code, so treat Onscript's 400 as success.
          Effect.catchTag('OnscriptServiceError', (error) =>
            error.status === 400 &&
            String(error.cause).includes('TokenNotExpiredError')
              ? Effect.void
              : Effect.fail(error)
          ),
          Effect.withSpan('onscript.sendSignInOtp')
        ),

      verifyOtp: (email, otp, ctx): Effect.Effect<OnscriptUser, OnscriptServiceError> =>
        call('POST', '/auth/verification', { email, otp }, ctx?.token).pipe(
          Effect.flatMap((json) => {
            const body = (json ?? {}) as { access_token?: unknown }
            const token = body.access_token
            if (typeof token !== 'string' || token === '') {
              return Effect.fail(
                new OnscriptServiceError({
                  cause: 'Onscript verification response had no access_token'
                })
              )
            }
            return Effect.succeed({ token, email })
          }),
          Effect.withSpan('onscript.verifyOtp')
        ),

      initiateConnect: (platform: OnscriptPlatform, ctx) =>
        call(
          'GET',
          `/integrations/${platform.toLowerCase()}/oauth/initiate`,
          undefined,
          ctx?.token
        ).pipe(
          Effect.flatMap((json) => {
            const authUrl = (json as { auth_url?: unknown } | null)?.auth_url
            return typeof authUrl === 'string' && authUrl.length > 0
              ? Effect.succeed(authUrl)
              : Effect.fail(
                  new OnscriptServiceError({
                    cause: 'Onscript initiate response had no auth_url'
                  })
                )
          }),
          Effect.withSpan('onscript.initiateConnect')
        ),

      disconnectAccount: (accountId, ctx) =>
        call(
          'POST',
          '/integrations/disconnect',
          { account_id: accountId },
          ctx?.token
        ).pipe(
          Effect.asVoid,
          Effect.withSpan('onscript.disconnectAccount')
        )
    })
  })
)
