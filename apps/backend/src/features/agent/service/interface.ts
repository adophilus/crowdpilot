import { Context, type Effect } from 'effect'
import type { AgentServiceError } from './error'

export type AgentMode = 'grounded' | 'plain'

export interface AgentToolCall {
  readonly name: string
  readonly summary: string
}

export interface AgentRunResult {
  readonly sessionId: string
  readonly text: string
  readonly evidenceRefs: ReadonlyArray<string>
  readonly toolCalls: ReadonlyArray<AgentToolCall>
}

// Progress events for SSE delivery — one per loop iteration, not per token.
export type AgentEvent =
  | { readonly type: 'tool'; readonly name: string; readonly summary: string }
  | {
      readonly type: 'evidence'
      readonly refs: ReadonlyArray<string>
    }
  | { readonly type: 'delta'; readonly text: string }
  | {
      readonly type: 'done'
      readonly text: string
      readonly evidenceRefs: ReadonlyArray<string>
    }
  | { readonly type: 'error'; readonly message: string }

export interface AgentRunArgs {
  readonly sessionId?: string | undefined
  readonly message: string
  readonly mode?: AgentMode | undefined
  readonly onEvent?: ((event: AgentEvent) => void) | undefined
}

export interface AgentShape {
  run: (args: AgentRunArgs) => Effect.Effect<AgentRunResult, AgentServiceError>
}

export class AgentService extends Context.Tag('AgentService')<
  AgentService,
  AgentShape
>() {}
