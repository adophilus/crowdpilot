import { HttpApiBuilder, HttpServerRequest } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import { RequestCodeSuccess } from '@crowdpilot/api/Auth/RequestCodeEndpoint'
import { VerifySuccess } from '@crowdpilot/api/Auth/VerifyEndpoint'
import { MeSuccess } from '@crowdpilot/api/Auth/MeEndpoint'
import { LogoutSuccess } from '@crowdpilot/api/Auth/LogoutEndpoint'
import { Auth } from '../service'

const bearerOf = (authorization: string | undefined) =>
  authorization?.replace(/^Bearer\s+/i, '') ?? ''

export const AuthApiLive = HttpApiBuilder.group(Api, 'Auth', (handlers) =>
  Effect.gen(function* () {
    const auth = yield* Auth

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
  })
)
