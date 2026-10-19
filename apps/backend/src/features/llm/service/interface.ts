import { Context, type Effect } from 'effect'
import type { LlmServiceError } from './error'

// Minimal OpenAI-compatible chat types — only what the agent tool loop needs.
export interface LlmMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool'
  readonly content: string | null
  readonly tool_calls?: ReadonlyArray<{
    readonly id: string
    readonly type: 'function'
    readonly function: { readonly name: string; readonly arguments: string }
  }>
  readonly tool_call_id?: string
}

export interface LlmTool {
  readonly type: 'function'
  readonly function: {
    readonly name: string
    readonly description: string
    readonly parameters: Record<string, unknown>
  }
}

export interface LlmChatArgs {
  readonly messages: ReadonlyArray<LlmMessage>
  readonly tools?: ReadonlyArray<LlmTool> | undefined
}

export interface LlmChatResult {
  // The raw assistant message — append verbatim to keep tool_calls intact.
  readonly message: LlmMessage
}

export interface LlmShape {
  chat: (args: LlmChatArgs) => Effect.Effect<LlmChatResult, LlmServiceError>
}

export class LlmService extends Context.Tag('LlmService')<
  LlmService,
  LlmShape
>() {}
