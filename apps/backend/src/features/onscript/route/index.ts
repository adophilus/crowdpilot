import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import BadRequestError from '@crowdpilot/api/common/BadRequestError'
import NotFoundError from '@crowdpilot/api/common/NotFoundError'
import OnscriptError from '@crowdpilot/api/common/OnscriptError'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import {
  AccountsSuccess,
  ConnectClaimSuccess,
  ConnectUrlSuccess,
  OkSuccess
} from '@crowdpilot/api/Onscript/index'
import { Sql } from '@crowdpilot/sql'
import { OnscriptService, OnscriptServiceError } from '../service'

// Onscript upstream 4xx means something the caller can fix (unknown
// account); 5xx is our proxy failing.
const toApiError = (
  error: OnscriptServiceError
): Effect.Effect<never, BadRequestError | OnscriptError> =>
  error.status !== undefined && error.status < 500
    ? Effect.fail(new BadRequestError({ message: String(error.cause) }))
    : Effect.fail(new OnscriptError({ message: String(error.cause) }))

// In-memory pending-connect registry (userId -> platform + started-at).
// Single backend process, hackathon scale: ponytail — promote to the
// connected_accounts table if multi-instance or restarts mid-popup matter.
const pendingConnects = new Map<string, { platform: string; startedAt: number }>()

export const OnscriptApiLive = HttpApiBuilder.group(
  Api,
  'Onscript',
  (handlers) =>
    Effect.gen(function* () {
      const onscript = yield* OnscriptService
      const sql = yield* Sql

      const mappedAccountsFor = (userId: string) =>
        Effect.tryPromise({
          try: () =>
            sql
              .selectFrom('connected_accounts')
              .where('user_id', '=', userId)
              .selectAll()
              .execute(),
          catch: (cause) => new OnscriptError({ message: String(cause) })
        })

      return handlers
        // Ownership lives HERE, not in Onscript: every social account
        // connected through CrowdPilot sits under the single shared Onscript
        // account, and this mapping says which CrowdPilot user owns it.
        .handle('onscriptAccounts', () =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(mappedAccountsFor(user.id), (rows) =>
              Effect.succeed(
                AccountsSuccess.make({
                  accounts: rows.map((row) => ({
                    id: row.onscript_account_id,
                    platform: row.platform as 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM',
                    ...(row.username ? { username: row.username } : {}),
                    ...(row.display_name
                      ? { displayName: row.display_name }
                      : {}),
                    isActive: true
                  }))
                })
              )
            )
          )
        )
        .handle('onscriptConnectUrl', ({ payload }) =>
          Effect.flatMap(CurrentUser, (user) =>
            onscript.initiateConnect(payload.platform).pipe(
              Effect.map((authUrl) => {
                pendingConnects.set(user.id, {
                  platform: payload.platform,
                  startedAt: Date.now()
                })
                return ConnectUrlSuccess.make({ authUrl })
              }),
              Effect.catchTag('OnscriptServiceError', toApiError)
            )
          )
        )
        .handle('onscriptConnectClaim', () =>
          Effect.flatMap(CurrentUser, (user) => {
            const pending = pendingConnects.get(user.id)
            if (!pending) {
              return Effect.fail(
                new BadRequestError({ message: 'No connect flow started' })
              )
            }
            pendingConnects.delete(user.id)
            return onscript.listConnectedAccounts().pipe(
              Effect.flatMap((accounts) => {
                const candidates = accounts.filter(
                  (account) =>
                    account.platform === pending.platform &&
                    account.isActive &&
                    // skip accounts already mapped to any CrowdPilot user
                    account.id.length > 0
                )
                return Effect.flatMap(mappedAccountsFor(user.id), (owned) => {
                  const ownedIds = new Set(owned.map((r) => r.onscript_account_id))
                  void ownedIds
                  return Effect.flatMap(
                    // All mapped ids across ALL users — an account owned by
                    // someone else is never a claim candidate.
                    Effect.tryPromise({
                      try: () =>
                        sql
                          .selectFrom('connected_accounts')
                          .select('onscript_account_id')
                          .execute(),
                      catch: (cause) =>
                        new OnscriptError({ message: String(cause) })
                    }),
                    (allMapped) => {
                      const taken = new Set(
                        allMapped.map((row) => row.onscript_account_id)
                      )
                      const fresh = candidates.filter(
                        (account) => !taken.has(account.id)
                      )
                      const newest = fresh
                        .slice()
                        .sort((a, b) =>
                          (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
                        )[0]
                      if (!newest) {
                        return Effect.succeed(
                          ConnectClaimSuccess.make({ claimed: false })
                        )
                      }
                      return Effect.flatMap(
                        Effect.tryPromise({
                          try: () =>
                            sql
                              .insertInto('connected_accounts')
                              .values({
                                user_id: user.id,
                                platform: pending.platform,
                                onscript_account_id: newest.id,
                                username: newest.username,
                                display_name: newest.displayName ?? null
                              })
                              .onConflict((oc) =>
                                oc.columns(['platform', 'onscript_account_id']).doNothing()
                              )
                              .returningAll()
                              .executeTakeFirstOrThrow(),
                          catch: (cause) =>
                            new OnscriptError({ message: String(cause) })
                        }),
                        (row) =>
                          Effect.succeed(
                            ConnectClaimSuccess.make({
                              claimed: true,
                              account: {
                                id: row.onscript_account_id,
                                platform: pending.platform as
                                  | 'TWITTER'
                                  | 'FACEBOOK'
                                  | 'INSTAGRAM',
                                ...(row.username
                                  ? { username: row.username }
                                  : {}),
                                ...(row.display_name
                                  ? { displayName: row.display_name }
                                  : {})
                              }
                            })
                          )
                      )
                    }
                  )
                })
              }),
              Effect.catchTag('OnscriptServiceError', toApiError)
            )
          })
        )
        .handle('onscriptDisconnectAccount', ({ payload }) =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(mappedAccountsFor(user.id), (owned) => {
              const row = owned.find(
                (candidate) =>
                  candidate.onscript_account_id === payload.accountId
              )
              if (!row) {
                // Someone else's account (or unknown) — never proxiable.
                return Effect.fail(
                  new NotFoundError({
                    message: 'No such connected account for this user'
                  })
                )
              }
              return onscript.disconnectAccount(payload.accountId).pipe(
                Effect.flatMap(() =>
                  Effect.flatMap(
                    Effect.tryPromise({
                      try: () =>
                        sql
                          .deleteFrom('connected_accounts')
                          .where('user_id', '=', user.id)
                          .where('onscript_account_id', '=', payload.accountId)
                          .execute(),
                      catch: (cause) =>
                        new OnscriptError({ message: String(cause) })
                    }),
                    () => Effect.succeed(OkSuccess.make({ ok: true }))
                  )
                ),
                Effect.catchTag('OnscriptServiceError', (error) =>
                  Effect.fail(
                    error.status !== undefined && error.status < 500
                      ? new NotFoundError({
                          message: 'Account no longer exists on Onscript'
                        })
                      : new OnscriptError({ message: String(error.cause) })
                  )
                )
              )
            })
          )
        )
    })
)
