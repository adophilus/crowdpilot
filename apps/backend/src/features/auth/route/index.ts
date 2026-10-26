import { HttpApiBuilder, HttpServerRequest, HttpServerResponse } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import { RequestCodeSuccess } from '@crowdpilot/api/Auth/RequestCodeEndpoint'
import { VerifySuccess } from '@crowdpilot/api/Auth/VerifyEndpoint'
import { MeSuccess } from '@crowdpilot/api/Auth/MeEndpoint'
import { LogoutSuccess } from '@crowdpilot/api/Auth/LogoutEndpoint'
import { AppConfig } from '@/features/config'
import { Auth } from '../service'

const bearerOf = (authorization: string | undefined) =>
  authorization?.replace(/^Bearer\s+/i, '') ?? ''

export const AuthApiLive = HttpApiBuilder.group(Api, 'Auth', (handlers) =>
  Effect.gen(function* () {
    const auth = yield* Auth
    const config = yield* AppConfig

    const failRedirect = HttpServerResponse.redirect(
      `${config.googleOAuth.successRedirect}#error=google_failed`,
      // 302, not the library's 301 default — /auth/google/start must never be
      // served from cache (it mints a fresh one-time state per request).
      { status: 302 }
    )

    return handlers
      .handle('requestCode', ({ payload }) =>
        auth.requestCode(payload.email).pipe(
          Effect.as(RequestCodeSuccess.make({ ok: true })),
          Effect.catchTags({
            AuthEmailError: () => Effect.fail(new UnexpectedError())
          })
        )
      )
      .handle('verify', ({ payload }) =>
        auth.verify(payload.email, payload.code).pipe(
          Effect.map(({ token, user }) => VerifySuccess.make({ token, user })),
          Effect.catchTags({
            AuthEmailError: () => Effect.fail(new UnexpectedError())
          })
        )
      )
      .handle('me', () =>
        Effect.map(CurrentUser, (user) => MeSuccess.make({ user }))
      )
      .handle('logout', () =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          yield* auth.logout(bearerOf(request.headers.authorization))
          return LogoutSuccess.make({ ok: true })
        }).pipe(
          Effect.catchTags({
            AuthEmailError: () => Effect.fail(new UnexpectedError())
          })
        )
      )
      .handleRaw('googleStart', () =>
        Effect.map(
          auth.googleStart(),
          (url) => HttpServerResponse.redirect(url, { status: 302 })
        ).pipe(Effect.catchAll(() => Effect.succeed(failRedirect)))
      )
      .handleRaw('googleCallback', (request) => {
        const { code, state } = request.urlParams
        if (!code || !state) return Effect.succeed(failRedirect)
        return Effect.flatMap(auth.googleSignIn(code, state), ({ token }) =>
          Effect.succeed(
            HttpServerResponse.redirect(
              // Token rides in the fragment so it never hits server logs.
              // The web app's /auth/callback route consumes it and calls /auth/me.
              // ponytail: token-in-fragment is fine for the demo; cookie sessions
              // if we ever care about shared machines.
              `${config.googleOAuth.successRedirect}#token=${token}`,
              { status: 302 }
            )
          )
        ).pipe(Effect.catchAll(() => Effect.succeed(failRedirect)))
      })
  })
)
