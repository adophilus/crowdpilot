import { Data } from 'effect'

export class OnscriptServiceError extends Data.TaggedError('OnscriptServiceError')<{
  readonly cause: unknown
  // HTTP status Onscript responded with, when known — lets callers map
  // upstream 4xx (bad OTP, 402 plan limits) differently from 5xx.
  readonly status?: number
}> {}

export class OnscriptNotFoundError extends Data.TaggedError('OnscriptNotFoundError')<{
  readonly postId?: string
}> {}
