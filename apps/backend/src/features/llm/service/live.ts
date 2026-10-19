import { Effect, Layer } from 'effect'
import { AppConfig } from '@/features/config'
import { LlmServiceError } from './error'
import {
  LlmService,
  type LlmChatArgs,
  type LlmChatResult
} from './interface'

const DEFAULT_BASE_URL = 'https://api.z.ai/api/paas/v4'
const DEFAULT_MODEL = 'glm-4.6'

export const LlmServiceLive = Layer.effect(
  LlmService,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const baseUrl = (config.llm.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    const model = config.llm.model ?? DEFAULT_MODEL

    return LlmService.of({
      chat: (args: LlmChatArgs) =>
        // Non-streaming: the loop needs whole tool_calls per iteration.
        Effect.tryPromise({
          try: async () => {
            const response = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.llm.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model,
                messages: args.messages,
                ...(args.tools && args.tools.length > 0
                  ? { tools: args.tools, tool_choice: 'auto' }
                  : {})
              })
            })
            const json: unknown = await response.json().catch(() => undefined)
            if (!response.ok) {
              throw new Error(
                `LLM responded ${response.status}: ${JSON.stringify(json)}`
              )
            }
            const message = (
              json as {
                choices?: Array<{ message?: LlmChatResult['message'] }>
              }
            )?.choices?.[0]?.message
            if (!message) {
              throw new Error(
                `LLM returned no message: ${JSON.stringify(json)}`
              )
            }
            return { message } satisfies LlmChatResult
          },
          catch: (cause) => new LlmServiceError({ cause })
        }).pipe(Effect.withSpan('llm.chat'))
    })
  })
)
