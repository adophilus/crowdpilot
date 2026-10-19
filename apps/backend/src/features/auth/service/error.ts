import { Data } from 'effect'

export class AuthEmailError extends Data.TaggedError('AuthEmailError')<{
  cause: unknown
}> {}
