import { Context, type Effect } from 'effect'
import type { SessionUser } from '@crowdpilot/api/common/CurrentUser'
import type InvalidOrExpiredCodeError from '@crowdpilot/api/common/InvalidOrExpiredCodeError'
import type { AuthEmailError, GoogleAuthError } from './error'

export interface AuthShape {
  requestCode: (email: string) => Effect.Effect<void, AuthEmailError>
  verify: (
    email: string,
    code: string
  ) => Effect.Effect<
    { token: string; user: SessionUser },
    AuthEmailError | InvalidOrExpiredCodeError
  >
  logout: (rawToken: string) => Effect.Effect<void, AuthEmailError>
  createSessionForUser: (
    userId: string
  ) => Effect.Effect<{ token: string; expiresIn: number }, AuthEmailError>
  googleStart: () => Effect.Effect<string, GoogleAuthError>
  googleSignIn: (
    code: string,
    state: string
  ) => Effect.Effect<
    { token: string; user: SessionUser },
    GoogleAuthError | AuthEmailError
  >
}

export class Auth extends Context.Tag('Auth')<Auth, AuthShape>() {}
