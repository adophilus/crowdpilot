import { Data } from 'effect'

export class AgentServiceError extends Data.TaggedError('AgentServiceError')<{
  readonly cause: unknown
}> {}
