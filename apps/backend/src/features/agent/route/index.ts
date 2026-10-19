import { HttpApiBuilder, HttpServerResponse } from '@effect/platform'
import { Effect, Queue, Stream } from 'effect'
import { Api } from '@crowdpilot/api'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import { ChatSyncSuccess } from '@crowdpilot/api/Chat/ChatSyncEndpoint'
import { AgentService, type AgentEvent } from '../service'

const sseOf = (event: AgentEvent) =>
  `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`

// Terminates the response stream: the runner offers this after `done` and the
// consumer ends the stream on it — the SSE response must be finite.
const STREAM_END = '__END__'

export const AgentApiLive = HttpApiBuilder.group(Api, 'Chat', (handlers) =>
  Effect.gen(function* () {
    const agent = yield* AgentService

    return handlers
      .handleRaw('chat', ({ payload }) =>
        Effect.gen(function* () {
          const queue = yield* Queue.unbounded<string>()

          // ponytail: the runner is a forkDaemon fiber writing into the queue;
          // a client disconnect lets the run finish in the background (run caps
          // at 6 LLM iterations), then the queue is abandoned with its fiber.
          // Persist/interrupt on disconnect if that ever matters.
          yield* agent
            .run({
              sessionId: payload.sessionId,
              message: payload.message,
              mode: payload.mode,
              onEvent: (event) => Queue.unsafeOffer(queue, sseOf(event))
            })
            .pipe(
              Effect.catchAll((error) =>
                Effect.sync(() => {
                  Queue.unsafeOffer(
                    queue,
                    sseOf({
                      type: 'error',
                      message: String(error.cause ?? 'agent run failed')
                    })
                  )
                })
              ),
              Effect.andThen(
                Effect.sync(() => Queue.unsafeOffer(queue, STREAM_END))
              ),
              Effect.forkDaemon
            )

          return HttpServerResponse.stream(
            Stream.fromQueue(queue).pipe(
              Stream.takeWhile((chunk) => chunk !== STREAM_END),
              Stream.encodeText
            ),
            { contentType: 'text/event-stream' }
          )
        })
      )
      .handle('chatSync', ({ payload }) =>
        agent
          .run({
            sessionId: payload.sessionId,
            message: payload.message,
            mode: payload.mode
          })
          .pipe(
            Effect.map((result) =>
              ChatSyncSuccess.make({
                sessionId: result.sessionId,
                text: result.text,
                evidenceRefs: [...result.evidenceRefs],
                toolCalls: result.toolCalls.map((call) => ({
                  name: call.name,
                  summary: call.summary
                }))
              })
            ),
            Effect.catchTag('AgentServiceError', (error) =>
              Effect.fail(
                new UnexpectedError({
                  message: `Agent run failed: ${String(error.cause)}`
                })
              )
            )
          )
      )
  })
)
