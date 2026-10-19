import { API_URL } from './api'

// Mirrors apps/backend/src/features/agent/service/interface.ts AgentEvent
export type AgentEvent =
  | { type: 'tool'; name: string; summary: string }
  | { type: 'evidence'; refs: readonly string[] }
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; evidenceRefs: readonly string[] }
  | { type: 'error'; message: string }

export interface StreamChatArgs {
  token: string | null
  sessionId: string
  message: string
  mode?: 'grounded' | 'plain'
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}

// POST /chat SSE via fetch ReadableStream — the typed client can't stream.
// Backend frames each event as `event: <type>\ndata: <full event json>\n\n`.
export async function streamChat(args: StreamChatArgs): Promise<void> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(args.token ? { authorization: `Bearer ${args.token}` } : {})
    },
    body: JSON.stringify({
      sessionId: args.sessionId,
      message: args.message,
      mode: args.mode
    }),
    signal: args.signal
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Chat failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`
    )
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const dispatch = (block: string) => {
    for (const line of block.split('\n')) {
      if (!line.startsWith('data:')) continue
      try {
        const event = JSON.parse(line.slice(5).trim()) as AgentEvent
        if (event && typeof event.type === 'string') args.onEvent(event)
      } catch {
        /* skip malformed frame */
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      dispatch(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }
  }
  if (buffer.trim()) dispatch(buffer)
}
