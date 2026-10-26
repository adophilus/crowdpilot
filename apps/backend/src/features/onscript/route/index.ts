import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import BadRequestError from '@crowdpilot/api/common/BadRequestError'
import OnscriptError from '@crowdpilot/api/common/OnscriptError'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import {
  AccountsSuccess,
  ConnectUrlSuccess,
  LinkVerifySuccess,
  OkSuccess,
  SessionStatusSuccess
} from '@crowdpilot/api/Onscript/index'
import { Sql } from '@crowdpilot/sql'
import { OnscriptService, OnscriptServiceError } from '../service'

// Onscript upstream 4xx means something the caller can fix (wrong OTP,
// unknown account); 5xx is our proxy failing.
const toApiError = (
  error: OnscriptServiceError
): Effect.Effect<never, BadRequestError | OnscriptError> =>
  error.status !== undefined && error.status < 500
    ? Effect.fail(new BadRequestError({ message: String(error.cause) }))
    : Effect.fail(new OnscriptError({ message: String(error.cause) }))

export const OnscriptApiLive = HttpApiBuilder.group(
  Api,
  'Onscript',
  (handlers) =>
    Effect.gen(function* () {
      const onscript = yield* OnscriptService
      const sql = yield* Sql

      const sessionFor = (userId: string) =>
        Effect.tryPromise({
          try: () =>
            sql
              .selectFrom('onscript_sessions')
              .where('user_id', '=', userId)
              .selectAll()
              .executeTakeFirst(),
          catch: (cause) => new OnscriptError({ message: String(cause) })
        })

      const tokenFor = (userId: string) =>
        Effect.map(sessionFor(userId), (row) => row?.access_token ?? null)

      return handlers
        .handle('sessionStatus', () =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(sessionFor(user.id), (row) =>
              Effect.succeed(
                SessionStatusSuccess.make({
                  linked: row !== undefined,
                  ...(row !== undefined ? { email: row.email } : {}),
                  usingServiceAccount: row === undefined
                })
              )
            )
          )
        )
        .handle('linkStart', ({ payload }) =>
          onscript.sendSignInOtp(payload.email).pipe(
            Effect.map(() => OkSuccess.make({ ok: true })),
            Effect.catchTag('OnscriptServiceError', toApiError)
          )
        )
        .handle('linkVerify', ({ payload }) =>
          Effect.flatMap(CurrentUser, (user) =>
            onscript.verifyOtp(payload.email, payload.otp).pipe(
              Effect.flatMap((linked) =>
                Effect.flatMap(
                  Effect.tryPromise({
                    try: () =>
                      sql
                        .insertInto('onscript_sessions')
                        .values({
                          user_id: user.id,
                          email: linked.email,
                          access_token: linked.token
                        })
                        .onConflict((oc) =>
                          oc.column('user_id').doUpdateSet({
                            email: linked.email,
                            access_token: linked.token
                          })
                        )
                        .execute(),
                    catch: (cause) =>
                      new OnscriptError({ message: String(cause) })
                  }),
                  () => Effect.succeed(LinkVerifySuccess.make({ email: linked.email }))
                )
              ),
              Effect.catchTag('OnscriptServiceError', toApiError)
            )
          )
        )
        .handle('linkDisconnect', () =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(
              Effect.tryPromise({
                try: () =>
                  sql
                    .deleteFrom('onscript_sessions')
                    .where('user_id', '=', user.id)
                    .execute(),
                catch: (cause) => new OnscriptError({ message: String(cause) })
              }),
              () => Effect.succeed(OkSuccess.make({ ok: true }))
            )
          )
        )
        .handle('onscriptAccounts', () =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(tokenFor(user.id), (token) =>
              onscript.listConnectedAccounts({ token }).pipe(
                Effect.map((accounts) =>
                  AccountsSuccess.make({
                    accounts: accounts
                      .filter((account) => isSupported(account.platform))
                      .map((account) => ({
                        id: account.id,
                        platform: account.platform as SupportedPlatform,
                        username: account.username,
                        ...(account.displayName
                          ? { displayName: account.displayName }
                          : {}),
                        isActive: account.isActive
                      }))
                  })
                ),
                Effect.catchTag('OnscriptServiceError', toApiError)
              )
            )
          )
        )
        .handle('onscriptConnectUrl', ({ payload }) =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(tokenFor(user.id), (token) =>
              onscript.initiateConnect(payload.platform, { token }).pipe(
                Effect.map((authUrl) => ConnectUrlSuccess.make({ authUrl })),
                Effect.catchTag('OnscriptServiceError', toApiError)
              )
            )
          )
        )
        .handle('onscriptDisconnectAccount', ({ payload }) =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(tokenFor(user.id), (token) =>
              onscript.disconnectAccount(payload.accountId, { token }).pipe(
                Effect.map(() => OkSuccess.make({ ok: true })),
                Effect.catchTag('OnscriptServiceError', toApiError)
              )
            )
          )
        )
    })
)

type SupportedPlatform = 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'
const SUPPORTED: ReadonlyArray<string> = ['TWITTER', 'FACEBOOK', 'INSTAGRAM']
const isSupported = (platform: string): platform is SupportedPlatform =>
  SUPPORTED.includes(platform)
