import { HttpApiEndpoint, HttpApiSchema, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import UnexpectedError from '../common/UnexpectedError'

export class ChatPayload extends Schema.Class<ChatPayload>('ChatPayload')({
  sessionId: Schema.optional(Schema.String),
  message: Schema.String,
  mode: Schema.optional(Schema.Literal('grounded', 'plain'))
}) {}

const ChatEndpoint = HttpApiEndpoint.post('chat', '/chat')
  .setPayload(ChatPayload)
  .addSuccess(HttpApiSchema.Text({ contentType: 'text/event-stream' }))
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Streaming chat with the CrowdPilot agent. Server-sent events: `tool` (tool name + short result summary), `evidence` (Qloo evidence ref ids), `delta` (assistant text, batched per loop iteration), `done` (final text + evidence refs + sessionId), `error`. Auth: session bearer token.'
  )

export default ChatEndpoint
