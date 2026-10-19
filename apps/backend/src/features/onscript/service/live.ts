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
  type OnscriptPost
} from './interface'

const firstPermalink = (posts: unknown): string | undefined => {
  if (!Array.isArray(posts)) return undefined
  for (const row of posts) {
    const url = (row as { url?: unknown } | null)?.url
    if (typeof url === 'string' && url.length > 0) return url
  }
  return undefined
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
  return {
    id: String(body.id ?? ''),
    status: typeof body.status === 'string' ? body.status : 'UNKNOWN',
    url: directUrl ?? firstPermalink(body.platform_posts)
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
      payload?: unknown
    ) {
      const url = `${baseUrl}${path}`
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${config.onscript.sessionToken}`,
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
            cause: `Onscript responded ${result.status}: ${JSON.stringify(result.json)}`
          })
        )
      }
      return result.json
    })

    return OnscriptService.of({
      listConnectedAccounts: () =>
        call('GET', '/integrations/connected-accounts').pipe(
          Effect.map((json): ReadonlyArray<ConnectedAccount> => {
            const data = (json as { data?: unknown } | null)?.data
            if (!Array.isArray(data)) return []
            return data
              .map((row) => {
                const account = (row ?? {}) as {
                  id?: unknown
                  platform?: unknown
                  platform_username?: unknown
                  is_active?: unknown
                }
                return {
                  id: String(account.id ?? ''),
                  platform: String(account.platform ?? ''),
                  username: String(account.platform_username ?? ''),
                  isActive: account.is_active !== false
                }
              })
              .filter((account) => account.id !== '')
          }),
          Effect.withSpan('onscript.listConnectedAccounts')
        ),

      createPost: (args: CreatePostArgs) =>
        call('POST', '/posts', {
          status: args.status,
          platforms: args.variants.map((variant) => ({
            platform: variant.platform,
            ...(variant.connectedAccountId
              ? { connected_account_id: variant.connectedAccountId }
              : {}),
            text: variant.text,
            media_ids: variant.mediaIds ? [...variant.mediaIds] : []
          }))
        }).pipe(
          Effect.map(postOf),
          Effect.withSpan('onscript.createPost')
        ),

      publishPost: (postId) =>
        // Empty object, not no-body — the API rejects a null payload.
      call('POST', `/posts/${encodeURIComponent(postId)}/publish`, {}).pipe(
          Effect.map(postOf),
          Effect.withSpan('onscript.publishPost')
        ),

      getPost: (postId) =>
        call('GET', `/posts/${encodeURIComponent(postId)}`).pipe(
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
        )
    })
  })
)
