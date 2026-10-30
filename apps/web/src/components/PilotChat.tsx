import { useEffect, useRef, useState } from 'react'
import { getToken } from '../lib/api'
import { useWorkspace } from '../lib/workspace'
import { streamChat } from '../lib/sse'
import { applyEvent, ChatMessage, type Msg } from './ChatMessage'
import { Icon, PilotAvatar } from './ui'

const uid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const pilotMsg = (text: string): Msg => ({
  id: uid(),
  role: 'assistant',
  text,
  toolCalls: [],
  evidenceRefs: [],
  streaming: false
})

// The conversation survives route changes inside the tab.
let cache: {
  owner: string
  sessionId: string
  messages: Msg[]
  primed: boolean
} | null = null

export function PilotChat({
  owner,
  intro,
  context,
  onClose
}: {
  owner: string
  intro: string[]
  context: string
  onClose: () => void
}) {
  if (!cache || cache.owner !== owner) {
    cache = {
      owner,
      sessionId: uid(),
      messages: intro.map(pilotMsg),
      primed: false
    }
  }
  const session = cache
  const [messages, setMessagesState] = useState<Msg[]>(session.messages)
  const [compare, setCompare] = useState<Record<string, Msg>>({})
  const [busy, setBusy] = useState(false)
  const ws = useWorkspace()
  const topDirection = ws.directions[0]
  const suggestions = [
    ...(topDirection ? [`Plan: ${topDirection.title.toLowerCase()}`] : []),
    'Who are my top fans?',
    'What should I post this week?'
  ]
  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  const setMessages = (fn: (ms: Msg[]) => Msg[]) =>
    setMessagesState((ms) => {
      const next = fn(ms)
      session.messages = next
      return next
    })

  // Keep the log pinned to the newest message.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, compare])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.innerWidth <= 1240) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    setDraft('')
    const aid = uid()
    setMessages((ms) => [
      ...ms,
      { ...pilotMsg(text), role: 'user' },
      { ...pilotMsg(''), id: aid, streaming: true }
    ])
    setBusy(true)
    // The agent has no server-side workspace store yet, so the first message
    // quietly carries the workspace context. Display stays clean.
    const message = session.primed ? text : `${context}\n\n${text}`
    session.primed = true
    const patch = (fn: (m: Msg) => Msg) =>
      setMessages((ms) => ms.map((m) => (m.id === aid ? fn(m) : m)))
    try {
      await streamChat({
        token: getToken(),
        sessionId: session.sessionId,
        message,
        onEvent: (event) => patch((m) => applyEvent(m, event))
      })
      patch((m) => (m.streaming ? { ...m, streaming: false } : m))
    } catch (err) {
      patch((m) => ({
        ...m,
        streaming: false,
        error:
          err instanceof Error
            ? `Pilot couldn't answer just now. ${err.message}`
            : 'Connection lost. Try again.'
      }))
    } finally {
      setBusy(false)
    }
  }

  // Same question, no Qloo: re-run the user turn before this answer in plain
  // mode so the difference grounding makes is visible.
  const runCompare = async (answerId: string) => {
    const idx = messages.findIndex((m) => m.id === answerId)
    const question = [...messages.slice(0, idx)]
      .reverse()
      .find((m) => m.role === 'user')
    if (!question || compare[answerId]) return
    const patch = (fn: (m: Msg) => Msg) =>
      setCompare((c) => ({ ...c, [answerId]: fn(c[answerId]) }))
    setCompare((c) => ({
      ...c,
      [answerId]: { ...pilotMsg(''), streaming: true }
    }))
    try {
      await streamChat({
        token: getToken(),
        sessionId: uid(),
        message: question.text,
        mode: 'plain',
        onEvent: (event) => patch((m) => applyEvent(m, event))
      })
      patch((m) => (m.streaming ? { ...m, streaming: false } : m))
    } catch (err) {
      patch((m) => ({
        ...m,
        streaming: false,
        error: err instanceof Error ? err.message : 'Connection lost.'
      }))
    }
  }

  return (
    <aside className="chatcol" aria-label="Pilot chat">
      <div className="chat-head">
        <div className="chat-who">
          <PilotAvatar />
          <span>
            <span className="chat-name">Pilot</span>
            <span className="chat-sub">Knows your audience</span>
          </span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close chat"
          onClick={onClose}
        >
          <Icon name="close" size={18} stroke={2} />
        </button>
      </div>

      <div className="chat-log" role="log" aria-live="polite" ref={logRef}>
        {messages.map((m) => (
          <div key={m.id} className="chat-turn" data-role={m.role}>
            <ChatMessage
              msg={m}
              busy={busy}
              onPublish={() =>
                void send(
                  'Publish that draft exactly as written to the connected demo account.'
                )
              }
            />
            {m.role === 'assistant' &&
              !m.streaming &&
              m.evidenceRefs.length > 0 &&
              !compare[m.id] && (
                <button
                  type="button"
                  className="compare-link"
                  onClick={() => void runCompare(m.id)}
                >
                  Compare without Qloo
                </button>
              )}
            {compare[m.id] && <ChatMessage msg={compare[m.id]} variant="plain" />}
          </div>
        ))}
      </div>

      <div className="chat-foot">
        <div className="chat-quick">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              className="chip chip-sm"
              disabled={busy}
              onClick={() => void send(q)}
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault()
            void send(draft)
          }}
        >
          <label htmlFor="cp-ask" className="sr-only">
            Ask Pilot
          </label>
          <input
            id="cp-ask"
            className="field field-sm"
            type="text"
            placeholder="Ask about your audience…"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            className="btn send-btn"
            type="submit"
            aria-label="Send"
            disabled={busy || !draft.trim()}
          >
            <Icon name="send" size={18} stroke={2} />
          </button>
        </form>
      </div>
    </aside>
  )
}
