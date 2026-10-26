import { Data } from 'effect'

export class AuthEmailError extends Data.TaggedError('AuthEmailError')<{
  cause: unknown
}> {}

export class GoogleAuthError extends Data.TaggedError('GoogleAuthError')<{
  cause: unknown
}> {}
