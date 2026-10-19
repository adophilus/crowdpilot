import { Data } from 'effect'

export class LlmServiceError extends Data.TaggedError('LlmServiceError')<{
  readonly cause: unknown
}> {}
