import { createFileRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  api,
  bearer,
  clearSession,
  getSignedInUser,
  getToken,
  type Profile,
  type SessionUser
} from '../lib/api'
import { streamChat } from '../lib/sse'
import { applyEvent, ChatMessage, type Msg } from '../components/ChatMessage'
import { ProfileCard } from '../components/ProfileCard'
import { AuthPanel } from '../components/AuthPanel'
import { SideBySide } from '../components/SideBySide'
import {
  DEMO_CROWD,
  DEMO_SUGGESTIONS,
  DEMO_WELCOME,
  OWN_SUGGESTIONS
} from '../lib/demo'

const queryClient = new QueryClient()

export const Route = createFileRoute('/')({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>
  )
})

const uid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const Wordmark = ({ onDark = false }: { onDark?: boolean }) => (
  <span className={`wordmark${onDark ? ' on-dark' : ''}`}>
    Crowd<span className="mark">✳</span>Pilot
  </span>
)

function Page() {
  const [entered, setEntered] = useState(false)
  const [demo, setDemo] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileStage, setProfileStage] = useState<'empty' | 'loading' | 'ready'>('empty')
  const [messages, setMessages] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authNote, setAuthNote] = useState<string | null>(null)
  const [sbsPlain, setSbsPlain] = useState<Msg | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)

  const sessionId = useRef(uid())
  const sbsSessionId = useRef(uid())
  const logRef = useRef<HTMLDivElement>(null)

  // Boot (client-only): read stored session for the header state.
  useEffect(() => {
    setUser(getSignedInUser())
    setHasToken(Boolean(getToken()))
  }, [])

  // Keep the log pinned to the newest message.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, sbsPlain])

  const enter = (opts?: { demo?: boolean }) => {
    setDemo(Boolean(opts?.demo))
    setEntered(true)
  }

  const handle401 = (): boolean => {
    clearSession()
    setUser(null)
    setHasToken(Boolean(getToken()))
    return false
  }

  // ---- demo persona: the <60s wow path ----
  const startDemo = async () => {
    setDemoError(null)
    if (!getToken()) {
      setAuthNote(
        'The instant demo runs on a seeded demo session (set VITE_DEMO_TOKEN when serving the app). No token? Sign in — it takes 20 seconds.'
      )
      setAuthOpen(true)
      return
    }
    enter({ demo: true })
    setProfileStage('loading')
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: DEMO_WELCOME,
        toolCalls: [],
        evidenceRefs: [],
        streaming: false
      }
    ])
    const { data, error, response } = await api.POST('/qloo/profile', {
      ...bearer(),
      body: { entityIds: [...DEMO_CROWD.entityIds] }
    })
    if (error) {
      if (response.status === 401 && !handle401()) {
        setEntered(false)
        setDemo(false)
        setProfileStage('empty')
        setAuthNote('The demo session expired. Sign in — or restart with a fresh VITE_DEMO_TOKEN.')
        setAuthOpen(true)
        return
      }
      setDemoError('Could not build the demo profile — is the backend up?')
      setProfileStage('empty')
      return
    }
    setProfile(data)
    setProfileStage('ready')
  }

  // ---- chat ----
  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    const aid = uid()
    setMessages((ms) => [
      ...ms,
      { id: uid(), role: 'user', text: trimmed, toolCalls: [], evidenceRefs: [], streaming: false },
      { id: aid, role: 'assistant', text: '', toolCalls: [], evidenceRefs: [], streaming: true }
    ])
    setBusy(true)
    const patch = (fn: (m: Msg) => Msg) =>
      setMessages((ms) => ms.map((m) => (m.id === aid ? fn(m) : m)))
    try {
      await streamChat({
        token: getToken(),
        sessionId: sessionId.current,
        message: trimmed,
        onEvent: (event) => patch((m) => applyEvent(m, event))
      })
    } catch (err) {
      patch((m) => ({
        ...m,
        streaming: false,
        error: err instanceof Error ? err.message : 'Connection lost — try again.'
      }))
    } finally {
      setBusy(false)
    }
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')

  // ---- side-by-side: re-run the last question without Qloo ----
  const openSbs = async () => {
    if (sbsPlain || busy || !lastUserMsg) return
    setSbsPlain({
      id: uid(),
      role: 'assistant',
      text: '',
      toolCalls: [],
      evidenceRefs: [],
      streaming: true
    })
    const patch = (fn: (m: Msg) => Msg) => setSbsPlain((m) => (m ? fn(m) : m))
    try {
      await streamChat({
        token: getToken(),
        sessionId: sbsSessionId.current,
        message: lastUserMsg.text,
        mode: 'plain',
        onEvent: (event) => patch((m) => applyEvent(m, event))
      })
    } catch (err) {
      patch((m) => ({
        ...m,
        streaming: false,
        error: err instanceof Error ? err.message : 'Connection lost.'
      }))
    }
  }

  const signOut = async () => {
    const { response } = await api.POST('/auth/logout', bearer())
    if (response.status === 401) clearSession()
    else clearSession()
    setUser(null)
    setHasToken(Boolean(getToken()))
    setEntered(false)
  }

  if (!entered) {
    return (
      <div className="landing">
        <div className="hero">
          <nav className="nav">
            <Wordmark onDark />
            <button
              type="button"
              className="btn btn-ghost btn-small on-dark"
              onClick={() => {
                if (getSignedInUser()) {
                  setUser(getSignedInUser())
                  enter()
                } else {
                  setAuthNote(null)
                  setAuthOpen(true)
                }
              }}
            >
              {user ? 'Open workspace →' : 'Sign in'}
            </button>
          </nav>

          <div className="hero-inner">
            <p className="eyebrow rise rise-1">For independent cafés, bars & boutiques</p>
            <h1 className="display rise rise-2">
              Know your crowd.
              <br />
              <em>Ship the post.</em>
            </h1>
            <p className="hero-sub rise rise-3">
              CrowdPilot reads what the people who fill your room actually love —
              the music, the food, the places, the brands — then turns it into
              tonight's playlist and a post your followers will feel. Grounded in
              Qloo, published in one click.
            </p>
            <div className="cta-row rise rise-4">
              <button type="button" className="btn btn-solid btn-big" onClick={startDemo}>
                Try the demo café <span className="btn-mark">→</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-big on-dark"
                onClick={() => {
                  setAuthNote(null)
                  setAuthOpen(true)
                }}
              >
                Sign in with email
              </button>
            </div>
            <p className="hero-note rise rise-4">
              No signup for the demo · Kofi's café, Lagos · every answer cites its Qloo evidence
            </p>
            {demoError && <p className="form-error" style={{ maxWidth: 420 }}>{demoError}</p>}
          </div>

          <div className="hero-strip rise rise-4">
            <div className="hero-step">
              <p className="step-label">Decide</p>
              <p>What to play, stock or sponsor — from your crowd's actual taste data.</p>
            </div>
            <div className="hero-step">
              <p className="step-label">Create</p>
              <p>Platform-aware drafts that cite the Qloo grounding behind the angle.</p>
            </div>
            <div className="hero-step">
              <p className="step-label">Ship</p>
              <p>Publish straight to your connected Instagram, X or Facebook.</p>
            </div>
          </div>
        </div>

        {authOpen && (
          <AuthPanel
            note={authNote}
            onClose={() => setAuthOpen(false)}
            onSignedIn={(u) => {
              setUser(u)
              setHasToken(true)
              setAuthOpen(false)
              enter()
            }}
          />
        )}
      </div>
    )
  }

  const suggestions = demo ? DEMO_SUGGESTIONS : OWN_SUGGESTIONS
  const crowdName = demo ? DEMO_CROWD.name : user ? `${user.email.split('@')[0]}'s crowd` : 'Your crowd'
  const crowdPlace = demo ? DEMO_CROWD.place : 'your neighbourhood'

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-side">
          <Wordmark />
        </div>
        <div className="topbar-side">
          <span className="session-chip">
            <span className="dot" aria-hidden />
            {demo ? "Demo — Kofi's café, Lagos" : (user?.email ?? 'Session active')}
          </span>
          {user ? (
            <button type="button" className="linkish" onClick={signOut}>
              Sign out
            </button>
          ) : (
            <button
              type="button"
              className="linkish"
              onClick={() => {
                setAuthNote(null)
                setAuthOpen(true)
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="workbench">
        <aside className="rail">
          <div className="rail-inner">
            <ProfileCard
              profile={profile}
              stage={profileStage}
              crowdName={crowdName}
              crowdPlace={crowdPlace}
            />
          </div>
        </aside>

        <main className="stage">
          <div className="chat-head">
            <h2>The conversation</h2>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              disabled={!lastUserMsg || busy || Boolean(sbsPlain)}
              title="Re-run your last question without Qloo data"
              onClick={openSbs}
            >
              {sbsPlain ? 'Comparing…' : 'Compare: without Qloo'}
            </button>
          </div>

          <div className="chat-log" ref={logRef} role="log" aria-label="Conversation">
            {messages.length === 0 && (
              <div className="profile-empty" style={{ maxWidth: 560 }}>
                <strong>{demo ? 'Ask away' : 'Start the conversation'}</strong>
                Ask what to play this weekend, what to stock, or say “draft an IG
                post about Saturday”. Answers cite the Qloo calls behind them —
                click any evidence badge to see the raw data.
              </div>
            )}
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                msg={m}
                busy={busy}
                onPublish={() => void send('Publish that draft exactly as written to the connected demo account.')}
              />
            ))}
          </div>

          <div className="suggest-row">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="suggest"
                disabled={busy}
                onClick={() => void send(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <Composer busy={busy} onSend={(t) => void send(t)} />

          {sbsPlain && lastUserMsg && (
            <SideBySide
              grounded={lastAssistantMsg ?? null}
              plain={sbsPlain}
              onClose={() => setSbsPlain(null)}
            />
          )}
        </main>
      </div>

      {authOpen && (
        <AuthPanel
          note={authNote}
          onClose={() => setAuthOpen(false)}
          onSignedIn={(u) => {
            setUser(u)
            setHasToken(true)
            setAuthOpen(false)
            setDemo(false)
          }}
        />
      )}
    </div>
  )
}

function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setText('')
    if (ref.current) ref.current.style.height = 'auto'
    onSend(trimmed)
  }

  return (
    <div className="composer">
      <textarea
        ref={ref}
        rows={1}
        placeholder="Ask about music, stock, events — or say “draft a post”…"
        value={text}
        aria-label="Message CrowdPilot"
        disabled={busy}
        onChange={(e) => {
          setText(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <button
        type="button"
        className="send-btn"
        aria-label="Send message"
        disabled={busy || !text.trim()}
        onClick={submit}
      >
        ↑
      </button>
    </div>
  )
}
