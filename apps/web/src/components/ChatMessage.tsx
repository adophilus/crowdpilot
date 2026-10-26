import { type ReactNode, useState } from 'react'
import type { AgentEvent } from '../lib/sse'
import { EvidenceBadge, EvidencePanel } from './EvidenceBadge'
import { Icon } from './ui'

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

// Capture group keeps the citation tokens in split parts — that's how inline
// citations survive into chip elements. The model cites singly [ev_0009] or
// in comma groups [ev_0009, ev_0011].
const EV_RE = /(\[ev_[\d, ]+\])/g

export function ChatMessage({
  msg,
  variant,
  onPublish,
  busy
}: {
  msg: Msg
  variant?: 'plain'
  onPublish?: () => void
  busy?: boolean
}) {
  const [openRef, setOpenRef] = useState<string | null>(null)

  if (msg.role === 'user') {
    return <div className="bubble bubble-me msg">{msg.text}</div>
  }

  const toggle = (id: string) => setOpenRef((cur) => (cur === id ? null : id))
  const { nodes, uncited } = renderText(msg.text, msg.evidenceRefs, openRef, toggle)
  const hasDraft = msg.toolCalls.some((c) => c.name === 'draft_post')
  const thinking = msg.streaming && !msg.text

  return (
    <div className={`bubble bubble-pilot msg${variant === 'plain' ? ' is-plain' : ''}`}>
      {variant === 'plain' && <span className="bubble-tag">Without Qloo</span>}
      {msg.toolCalls.length > 0 && (
        <ul className="tool-trail" aria-label="What Pilot checked">
          {msg.toolCalls.map((call, i) => (
            <li key={`${call.name}-${i}`}>
              <Icon name="check" size={11} stroke={3} />
              {call.summary}
            </li>
          ))}
        </ul>
      )}
      {thinking ? (
        <span className="thinking">Pilot is thinking…</span>
      ) : (msg.text || msg.streaming) && (
        <div className="bubble-text">
          {nodes}
          {msg.streaming && <span className="caret" aria-hidden="true" />}
        </div>
      )}
      {msg.error && <p className="bubble-error">{msg.error}</p>}
      {!msg.streaming && uncited.length > 0 && (
        <div className="ev-row">
          <span>Grounded in Qloo</span>
          {uncited.map((r) => (
            <EvidenceBadge
              key={r}
              refId={r}
              open={openRef === r}
              onToggle={() => toggle(r)}
            />
          ))}
        </div>
      )}
      {openRef && (
        <EvidencePanel refId={openRef} onClose={() => setOpenRef(null)} />
      )}
      {!msg.streaming && hasDraft && onPublish && (
        <button
          type="button"
          className="btn btn-accent btn-sm bubble-action"
          disabled={busy}
          onClick={onPublish}
        >
          Publish to the demo account
          <Icon name="arrow" size={14} stroke={2.2} />
        </button>
      )}
    </div>
  )
}

// Split assistant text into prose + inline evidence chips for the refs it
// cites. Refs the model omitted from prose are returned so the bubble can
// still list them — every answer stays traceable to its Qloo calls. Prose
// gets a tiny markdown pass; our own LLM output is the only source.
function renderText(
  text: string,
  refs: readonly string[],
  openRef: string | null,
  toggle: (id: string) => void
): { nodes: ReactNode[]; uncited: string[] } {
  const parts = text.split(EV_RE)
  const cited = new Set<string>()
  const nodes: ReactNode[] = parts.map((part, i) => {
    const group = part.match(/^\[(ev_[\d, ]+)\]$/)
    if (group) {
      const ids = group[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      for (const id of ids) cited.add(id)
      return (
        <span key={`e${i}`} className="ev-inline">
          {ids.map((id) => (
            <EvidenceBadge
              key={id}
              refId={id}
              open={openRef === id}
              onToggle={() => toggle(id)}
            />
          ))}
        </span>
      )
    }
    return (
      <span
        key={`t${i}`}
        dangerouslySetInnerHTML={{ __html: mdToHtml(part) }}
      />
    )
  })
  return { nodes, uncited: refs.filter((r) => !cited.has(r)) }
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
      return {
        ...msg,
        toolCalls: [...msg.toolCalls, { name: event.name, summary: event.summary }]
      }
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
