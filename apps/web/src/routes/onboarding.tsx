import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { GoogleMark, Icon, Wordmark } from '../components/ui'
import { API_URL, api, getSignedInUser, storeSession } from '../lib/api'
import {
  GOALS,
  type GoalId,
  LOVES,
  NICHE_CHIPS,
  NICHES_FOUND,
  PLATFORMS,
  type PlatformId,
  READING_TASKS,
  seedFor
} from '../lib/fixtures'
import {
  claimWorkspace,
  lovesFrom,
  readAudience,
  updateWorkspace,
  useWorkspace
} from '../lib/workspace'

export const Route = createFileRoute('/onboarding')({
  ssr: false,
  component: Onboarding
})

const SITE = 'https://crowdpilot.hackathons.adophilus.com'

function Onboarding() {
  const signedIn = Boolean(getSignedInUser())
  const [step, setStep] = useState(signedIn ? 1 : 0)
  const [fade, setFade] = useState(false)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => {
    const list = timers.current
    return () => {
      for (const t of list) clearTimeout(t)
    }
  }, [])

  const go = (n: number) => {
    if (fade) return
    setFade(true)
    later(() => {
      setStep(n)
      setFade(false)
    }, 200)
  }

  // ---- step 0: account ----
  const [authStep, setAuthStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authStep === 'code') codeRef.current?.focus()
  }, [authStep])

  const requestCode = async () => {
    setError(null)
    if (!/.+@.+\..+/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      const { error: apiError } = await api.POST('/auth/request-code', {
        body: { email: email.trim() }
      })
      if (apiError) {
        setError(errorMessage(apiError) ?? "Couldn't send the code. Try again.")
        return
      }
      setAuthStep('code')
    } catch {
      setError("Couldn't reach CrowdPilot. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  const verify = async (value = code) => {
    setError(null)
    if (!/^\d{6}$/.test(value.trim())) {
      setError('The code is 6 digits.')
      return
    }
    setBusy(true)
    try {
      const { data, error: apiError } = await api.POST('/auth/verify', {
        body: { email: email.trim(), code: value.trim() }
      })
      if (apiError || !data) {
        setError(
          apiError && 'InvalidOrExpiredCodeError' in apiError
            ? "That code didn't match. Check the email and try again."
            : (errorMessage(apiError) ?? 'Verification failed. Try again.')
        )
        return
      }
      storeSession(data.token, data.user)
      claimWorkspace({ email: data.user.email })
      go(1)
    } catch {
      setError("Couldn't reach CrowdPilot. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  // ---- step 1/2: goal + connect ----
  const [goal, setGoal] = useState<GoalId | null>(null)
  const [niche, setNiche] = useState('')
  const [connected, setConnected] = useState<Partial<Record<PlatformId, boolean>>>({})
  const [connecting, setConnecting] = useState<PlatformId | null>(null)
  const isBreak = goal === 'break'
  const anyConnected = PLATFORMS.some((p) => connected[p.id])
  const nicheName = niche.trim()

  // ---- step 3: reading ----
  const [prog, setProg] = useState(0)
  const [readFailed, setReadFailed] = useState(false)
  const readDone = useRef(false)
  const ws = useWorkspace()

  const startRead = () => {
    updateWorkspace({
      goal,
      niche: nicheName,
      connected: {
        x: Boolean(connected.x),
        fb: Boolean(connected.fb),
        tt: Boolean(connected.tt)
      }
    })
    readDone.current = false
    setReadFailed(false)
    setProg(0)
    go(3)
    void readAudience(seedFor(nicheName)).then((r) => {
      setReadFailed(r !== 'ok')
      readDone.current = true
    })
  }

  useEffect(() => {
    if (step !== 3) return
    const iv = window.setInterval(() => {
      setProg((p) => {
        // Hold just short of the end until Qloo actually answers.
        const cap = readDone.current ? 1 : 0.92
        return Math.min(cap, p + 0.018)
      })
    }, 80)
    return () => clearInterval(iv)
  }, [step])

  useEffect(() => {
    if (step === 3 && prog >= 1) later(() => go(4), 500)
  }, [step, prog])

  const restart = () => {
    setGoal(null)
    setNiche('')
    setConnected({})
    setProg(0)
    setEmail('')
    setCode('')
    setAuthStep('email')
    go(getSignedInUser() ? 1 : 0)
  }

  const tasks = [
    anyConnected
      ? 'Reading followers and engagement'
      : `Profiling the ${nicheName || 'niche'} crowd`,
    ...READING_TASKS
  ]
  const loves = lovesFrom(ws.profile, LOVES)

  return (
    <div className="onb">
      <main className="onb-main">
        {step > 0 && (
          <header className="onb-head">
            <Wordmark size={28} />
          </header>
        )}

        <div className="onb-stage fade" data-out={fade || undefined}>
          <div className="onb-col">
            {step === 0 && (
              <div className="onb-mark">
                <Wordmark size={28} />
              </div>
            )}

            {step === 0 && authStep === 'email' && (
              <>
                <h1 className="onb-title onb-title-xl">Let's find your people.</h1>
                <p className="onb-lede">
                  Create your account to get your first audience profile in about
                  two minutes.
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  onClick={() => {
                    window.location.href = `${API_URL}/auth/google/start`
                  }}
                >
                  <GoogleMark size={18} />
                  Continue with Google
                </button>
                <div className="or-rule">
                  <span />
                  or
                  <span />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!busy) void requestCode()
                  }}
                >
                  <label htmlFor="cp-email" className="label">
                    Email
                  </label>
                  <input
                    id="cp-email"
                    className="field"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={error ? 'cp-email-err' : undefined}
                  />
                  {error && (
                    <p id="cp-email-err" className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? 'Sending your code…' : 'Continue with email'}
                  </button>
                </form>
                <p className="fineprint">
                  By continuing you agree to the{' '}
                  <a href={`${SITE}/#terms`} target="_blank" rel="noopener">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href={`${SITE}/#privacy`} target="_blank" rel="noopener">
                    Privacy Policy
                  </a>
                  .
                </p>
              </>
            )}

            {step === 0 && authStep === 'code' && (
              <>
                <h1 className="onb-title">Check your inbox.</h1>
                <p className="onb-lede">
                  We sent a 6-digit code to <strong>{email.trim()}</strong>. It
                  expires in 10 minutes.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!busy) void verify()
                  }}
                >
                  <label htmlFor="cp-code" className="label">
                    Your code
                  </label>
                  <input
                    ref={codeRef}
                    id="cp-code"
                    className="field field-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    aria-invalid={Boolean(error) || undefined}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setCode(digits)
                      if (digits.length === 6 && !busy) void verify(digits)
                    }}
                  />
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={busy || code.length < 6}
                  >
                    {busy ? 'Checking…' : 'Verify and continue'}
                  </button>
                </form>
                <div className="onb-nav">
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => {
                      setAuthStep('email')
                      setCode('')
                      setError(null)
                    }}
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    className="btn-text"
                    disabled={busy}
                    onClick={() => void requestCode()}
                  >
                    Send a new code
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="onb-title">What do you want help with first?</h1>
                <p className="onb-lede">Pick one to start. You can switch any time.</p>
                <div role="radiogroup" aria-label="Your goal" className="goal-list">
                  {GOALS.map((g) => {
                    const on = goal === g.id
                    return (
                      // biome-ignore lint/a11y/useSemanticElements: custom radio card from the design
                      <button
                        key={g.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        className="opt goal"
                        data-on={on || undefined}
                        onClick={() => setGoal(g.id)}
                      >
                        <span className="goal-icon">
                          <Icon d={g.icon} size={22} />
                        </span>
                        <span className="goal-text">
                          <span className="goal-title">{g.title}</span>
                          <span className="goal-body">{g.body}</span>
                        </span>
                        <span className="radio" />
                      </button>
                    )
                  })}
                </div>
                <div className="onb-nav onb-nav-lg">
                  <button type="button" className="btn-text" onClick={() => go(0)}>
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={!goal}
                    onClick={() => go(2)}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="onb-title">
                  {isBreak
                    ? 'Which niche do you want to reach?'
                    : 'Connect where your audience lives'}
                </h1>
                <p className="onb-lede">
                  {isBreak
                    ? 'Describe the crowd you’re after. Connect your own accounts too if you want a comparison.'
                    : 'CrowdPilot reads who follows and engages with you. No socials yet? Describe your audience instead.'}
                </p>
                <div className="connect-stack">
                  <section aria-label="Connect accounts" style={{ order: isBreak ? 2 : 1 }}>
                    <div className="label">
                      {isBreak ? 'Optional: connect your accounts' : 'Your accounts'}
                    </div>
                    <div className="platform-list">
                      {PLATFORMS.map((p) => {
                        const on = Boolean(connected[p.id])
                        const wait = connecting === p.id
                        return (
                          <div key={p.id} className="platform-row" data-on={on || undefined}>
                            <span className="platform-glyph" aria-hidden="true">
                              <span />
                            </span>
                            <span className="platform-text">
                              <span className="platform-name">{p.name}</span>
                              <span className="platform-sub">
                                {on
                                  ? 'Connected · reading followers & engagement'
                                  : wait
                                    ? 'Waiting for permission…'
                                    : 'Read-only access to audience signals'}
                              </span>
                            </span>
                            <button
                              className={`btn btn-connect${on ? ' is-on' : ''}`}
                              type="button"
                              disabled={wait}
                              aria-label={`${on ? 'Disconnect' : 'Connect'} ${p.name}`}
                              onClick={() => {
                                if (on) {
                                  setConnected((c) => ({ ...c, [p.id]: false }))
                                  return
                                }
                                setConnecting(p.id)
                                later(() => {
                                  setConnecting(null)
                                  setConnected((c) => ({ ...c, [p.id]: true }))
                                }, 1100)
                              }}
                            >
                              {on ? 'Connected' : wait ? 'Connecting…' : 'Connect'}
                            </button>
                          </div>
                        )
                      })}
                      <div className="platform-more">
                        <span aria-hidden="true">
                          <Icon name="plus" size={18} stroke={2} />
                        </span>
                        More platforms coming soon
                      </div>
                    </div>
                  </section>
                  <section aria-label="Describe a niche" style={{ order: isBreak ? 1 : 2 }}>
                    <label htmlFor="cp-niche" className="label">
                      {isBreak ? 'The niche you want to reach' : 'Or describe your audience'}
                    </label>
                    <input
                      id="cp-niche"
                      className="field"
                      type="text"
                      placeholder="e.g. plant-based foodies in Nairobi"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                    <div className="chip-row">
                      {NICHE_CHIPS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="chip"
                          onClick={() => setNiche(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="onb-nav onb-nav-lg">
                  <button type="button" className="btn-text" onClick={() => go(1)}>
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={!(anyConnected || nicheName)}
                    onClick={startRead}
                  >
                    Read my audience
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="onb-title">Reading your audience…</h1>
                <p className="onb-lede">Hang tight. This usually takes under a minute.</p>
                <div
                  role="progressbar"
                  aria-label="Reading progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(prog * 100)}
                  className="progress"
                >
                  <div className="progress-bar" style={{ width: `${(prog * 100).toFixed(1)}%` }} />
                </div>
                <ul className="task-list">
                  {tasks.map((label, i) => {
                    const done = prog >= (i + 1) / 4 - 0.01
                    const active = !done && prog >= i / 4
                    return (
                      <li
                        key={label}
                        className="task"
                        data-state={done ? 'done' : active ? 'active' : 'idle'}
                      >
                        <span className="task-dot">
                          {done && <Icon name="check" size={12} stroke={3.2} />}
                        </span>
                        <span>{label}</span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {step === 4 && (
              <>
                <div className="pill-ok">
                  <Icon name="check" size={13} stroke={2.8} />
                  Profile ready
                </div>
                <h1 className="onb-title">Meet your audience.</h1>
                <p className="onb-lede onb-lede-tight">
                  {anyConnected
                    ? 'Here’s what the people who follow and engage with you have in common.'
                    : `Here’s what the ${nicheName || 'niche'} crowd has in common.`}
                </p>
                <div className="panel">
                  <div className="panel-label">They love</div>
                  <div className="tag-row">
                    {loves.map((l) => (
                      <span key={l} className="tag tag-lg">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="panel panel-last">
                  <div className="panel-label">Niches hiding in your crowd</div>
                  <div className="dot-list">
                    {NICHES_FOUND.map((n) => (
                      <div key={n}>
                        <span className="accent-dot" />
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                {readFailed && (
                  <p className="quiet-note">
                    Qloo didn't answer this time, so you're seeing a starter
                    profile. You can refresh it from Audience.
                  </p>
                )}
                <div className="onb-nav onb-nav-start">
                  <Link to="/home" className="btn btn-primary btn-arrow">
                    Open my dashboard
                    <span className="btn-arrow-dot" aria-hidden="true">
                      <Icon name="arrow" size={14} stroke={2.2} />
                    </span>
                  </Link>
                  <button type="button" className="btn-text btn-text-u" onClick={restart}>
                    Start over
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function errorMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m) return m
  }
  return null
}
