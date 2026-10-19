import { Data } from 'effect'

export class OnscriptServiceError extends Data.TaggedError('OnscriptServiceError')<{
  readonly cause: unknown
}> {}

export class OnscriptNotFoundError extends Data.TaggedError('OnscriptNotFoundError')<{
  readonly postId?: string
}> {}
