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

// Capture group keeps the citation tokens in split parts — that's how inline
// citations survive into badge elements. The model cites singly [ev_0009] or
// in comma groups [ev_0009, ev_0011].
const EV_RE = /(\[ev_[\d, ]+\])/g

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
        <div className="chips">
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
      <p className="assistant-text" style={{ margin: 0 }}>
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

// Split assistant text into prose + inline evidence badges for the refs it
// cites. Refs the model omitted from prose still get badges appended — every
// answer must stay traceable to its Qloo calls. Prose gets a tiny markdown
// pass (escape → bold → bullets); no dep, our own LLM output is the only source.
function renderText(text: string, refs: readonly string[]): React.ReactNode[] {
  const parts = text.split(EV_RE)
  const cited = new Set<string>()
  const nodes: React.ReactNode[] = parts.map((part, i) => {
    const group = part.match(/^\[(ev_[\d, ]+)\]$/)
    if (group) {
      const ids = group[1].split(',').map((s) => s.trim()).filter(Boolean)
      ids.forEach((id) => {
        cited.add(id)
      })
      return (
        <span key={`e${i}`}>
          {ids.map((id) => (
            <EvidenceBadge key={id} refId={id} />
          ))}
        </span>
      )
    }
    return <span key={`t${i}`} dangerouslySetInnerHTML={{ __html: mdToHtml(part) }} />
  })
  const uncited = refs.filter((r) => !cited.has(r))
  if (uncited.length > 0) {
    nodes.push(
      <span key="ev-extra" style={{ marginLeft: 6 }}>
        {uncited.map((r) => (
          <EvidenceBadge key={r} refId={r} />
        ))}
      </span>
    )
  }
  return nodes
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const mdToHtml = (s: string) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,4} (.+)$/gm, '<strong>$1</strong>')
    .replace(/^[*-] /gm, '• ')

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
