import { Data } from 'effect'

export class QlooServiceError extends Data.TaggedError('QlooServiceError')<{
  readonly cause: unknown
}> {}

export class QlooNotFoundError extends Data.TaggedError('QlooNotFoundError')<{
  readonly entityId?: string
  readonly query?: string
}> {}
