import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import UnexpectedError from '../common/UnexpectedError'
import { ChatPayload } from './ChatEndpoint'

export class ChatSyncSuccess extends Schema.TaggedClass<ChatSyncSuccess>()(
  'ChatSyncSuccess',
  {
  sessionId: Schema.String,
  text: Schema.String,
  evidenceRefs: Schema.Array(Schema.String),
  toolCalls: Schema.Array(
    Schema.Struct({ name: Schema.String, summary: Schema.String })
  )
}) {}

const ChatSyncEndpoint = HttpApiEndpoint.post('chatSync', '/chat/sync')
  .setPayload(ChatPayload)
  .addSuccess(ChatSyncSuccess)
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Non-streaming chat with the CrowdPilot agent — same loop as POST /chat but returns the full result as JSON (easy curl testing). Auth: session bearer token.'
  )

export default ChatSyncEndpoint
