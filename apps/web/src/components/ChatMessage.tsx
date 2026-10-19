import { EvidenceBadge } from './EvidenceBadge'
import type { AgentEvent } from '../lib/sse'

export interface ToolCall {
  name: string
  summary: string
}

export interface Msg {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls: ToolCall[]
  evidenceRefs: string[]
  streaming: boolean
  error?: string
}

const TOOL_ICONS: Record<string, string> = {
  qloo_search: '⌕',
  qloo_build_profile: '✳',
  qloo_affinities: '◈',
  list_connected_accounts: '◎',
  draft_post: '✎',
  publish_post: '➤'
}

const EV_RE = /\[ev_\d+\]/g

export function ChatMessage({
  msg,
  onPublish,
  busy
}: {
  msg: Msg
  onPublish?: () => void
  busy?: boolean
}) {
  if (msg.role === 'user') {
    return (
      <div className="msg msg-user">
        <div className="bubble">{msg.text}</div>
      </div>
    )
  }

  const hasDraft = msg.toolCalls.some((c) => c.name === 'draft_post')

  return (
    <div className="msg msg-assistant">
      {msg.toolCalls.length > 0 && (
        <div className="chips" aria-label="Tool calls">
          {msg.toolCalls.map((call, i) => (
            <span className="chip" key={`${call.name}-${i}`}>
              <span className="chip-ico" aria-hidden>
                {TOOL_ICONS[call.name] ?? '✓'}
              </span>
              <span className="chip-text">{call.summary}</span>
            </span>
          ))}
        </div>
      )}
      <p className="assistant-text" style={{ margin: 0 }} aria-live={msg.streaming ? 'polite' : undefined}>
        <span className="assistant-mark" aria-hidden>
          ✳
        </span>
        {renderText(msg.text, msg.evidenceRefs)}
        {msg.streaming && <span className="stream-caret" aria-hidden />}
      </p>
      {msg.error && <div className="msg-error">{msg.error}</div>}
      {!msg.streaming && msg.text && (
        <div className="msg-actions">
          <button
            type="button"
            className="msg-action"
            onClick={() => navigator.clipboard?.writeText(msg.text)}
          >
            Copy
          </button>
          {hasDraft && onPublish && (
            <button
              type="button"
              className="msg-action primary"
              disabled={busy}
              onClick={onPublish}
            >
              ➤ Publish to demo account
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Split assistant text into prose + evidence badges for refs it actually holds.
function renderText(text: string, refs: readonly string[]): React.ReactNode[] {
  const parts = text.split(EV_RE)
  const badges: React.ReactNode[] = []
  parts.forEach((part, i) => {
    badges.push(<span key={`t${i}`}>{part}</span>)
    const match = part.match(/^\[ev_\d+\]$/)
    if (match) {
      const refId = match[0].slice(1, -1)
      badges.push(
        <EvidenceBadge key={`e${i}`} refId={refId} />
      )
    }
  })
  return badges
}

// Fold a stream event into the trailing assistant message.
export function applyEvent(msg: Msg, event: AgentEvent): Msg {
  switch (event.type) {
    case 'tool':
      return { ...msg, toolCalls: [...msg.toolCalls, { name: event.name, summary: event.summary }] }
    case 'evidence':
      return {
        ...msg,
        evidenceRefs: [...new Set([...msg.evidenceRefs, ...event.refs])]
      }
    case 'delta':
      return { ...msg, text: msg.text + event.text }
    case 'done':
      return {
        ...msg,
        text: event.text || msg.text,
        evidenceRefs: [...new Set([...msg.evidenceRefs, ...event.evidenceRefs])],
        streaming: false
      }
    case 'error':
      return { ...msg, streaming: false, error: event.message }
  }
}
