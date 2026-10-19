import { HttpApiGroup } from '@effect/platform'
import ChatEndpoint, { ChatPayload } from './ChatEndpoint'
import ChatSyncEndpoint from './ChatSyncEndpoint'

const ChatApi = HttpApiGroup.make('Chat')
  .add(ChatEndpoint)
  .add(ChatSyncEndpoint)

export default ChatApi
export { ChatPayload }
