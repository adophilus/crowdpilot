// Onboarding step components, mounted by onboarding.$step.tsx. Kept in a
// dash-prefixed dir so the router ignores this file — one route on purpose:
// moving between steps navigates within /onboarding/$step, and all cross-step
// state lives in the lib/onboarding + lib/workspace stores (never local).
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { GoogleMark, Icon, PlatformMark, Wordmark } from '../../../components/ui'
import {
  API_URL,
  api,
  bearer,
  getSignedInUser,
  storeSession
} from '../../../lib/api'
import {
  API_PLATFORM,
  GOALS,
  type GoalId,
  LOVES,
  NICHES_FOUND,
  PLATFORMS,
  READING_TASKS,
} from '../../../lib/fixtures'
import {
  resetOnboarding,
  updateOnboarding,
  useOnboarding
} from '../../../lib/onboarding'
import {
  claimWorkspace,
  lovesFrom,
  readAudience,
  updateWorkspace,
  useWorkspace
} from '../../../lib/workspace'

const SITE = 'https://crowdpilot.hackathons.adophilus.com'

export function AccountStep() {
  const navigate = useNavigate()
  const ob = useOnboarding()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const authStep = ob.authStep
  const email = ob.email
  const code = ob.code

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
      updateOnboarding({ authStep: 'code' })
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
      updateOnboarding({ authStep: 'email', email: '', code: '' })
      void navigate({ to: '/onboarding/$step', params: { step: '2' } })
    } catch {
      setError("Couldn't reach CrowdPilot. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="onb-col">
      <div className="onb-mark">
        <Wordmark size={28} />
      </div>

      {authStep === 'email' && (
        <>
          <h1 className="onb-title onb-title-xl">Let's find your people.</h1>
          <p className="onb-lede">
            Create your account to get your first audience profile in about two
            minutes.
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
              onChange={(e) => updateOnboarding({ email: e.target.value })}
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
            <a href={`${SITE}/terms`} target="_blank" rel="noopener">
              Terms
            </a>{' '}
            and{' '}
            <a href={`${SITE}/privacy`} target="_blank" rel="noopener">
              Privacy Policy
            </a>
            .
          </p>
        </>
      )}

      {authStep === 'code' && (
        <>
          <h1 className="onb-title">Check your inbox.</h1>
          <p className="onb-lede">
            We sent a 6-digit code to <strong>{email.trim()}</strong>. It expires
            in 10 minutes.
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
                updateOnboarding({ code: digits })
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
                updateOnboarding({ authStep: 'email', code: '' })
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
    </div>
  )
}

export function GoalStep() {
  const navigate = useNavigate()
  const ob = useOnboarding()

  return (
    <div className="onb-col">
      <h1 className="onb-title">What do you want help with first?</h1>
      <p className="onb-lede">Pick the closest fit. We'll set your account up around it.</p>
      <div role="radiogroup" aria-label="Your goal" className="goal-list">
        {GOALS.map((g) => {
          const on = ob.goal === g.id
          return (
            // biome-ignore lint/a11y/useSemanticElements: custom radio card from the design
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={on}
              className="opt goal"
              data-on={on || undefined}
              onClick={() => updateOnboarding({ goal: g.id as GoalId })}
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
        <span />
        <button
          className="btn btn-primary"
          type="button"
          disabled={!ob.goal}
          onClick={() => navigate({ to: '/onboarding/$step', params: { step: '3' } })}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export function ConnectStep() {
  const navigate = useNavigate()
  const ob = useOnboarding()
  // Read-only peek at real accounts. No connect flow here — onboarding stays
  // unassisted; real connecting lives on the Accounts page.
  const [apiConnected, setApiConnected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { data } = await api.GET('/onscript/accounts', bearer())
        if (cancelled || !data) return
        const map = {
          x: data.accounts.some((a) => a.platform === API_PLATFORM.x && a.isActive),
          fb: data.accounts.some((a) => a.platform === API_PLATFORM.fb && a.isActive),
          ig: data.accounts.some((a) => a.platform === API_PLATFORM.ig && a.isActive)
        }
        setApiConnected(map)
        // Mirror into onboarding state so the reading/profile copy is honest.
        updateOnboarding((s) => ({ connected: { ...s.connected, x: map.x, fb: map.fb } }))
      } catch {
        /* backend quiet? keep the niche path */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const isBreak = ob.goal === 'break'
  const anyConnected = PLATFORMS.some((p) => Boolean(apiConnected[p.id]) || Boolean(ob.connected[p.id]))
  const nicheName = ob.niche.trim()

  const startRead = () => {
    updateWorkspace({
      goal: ob.goal,
      niche: nicheName,
      connected: {
        x: Boolean(apiConnected.x ?? ob.connected.x),
        fb: Boolean(apiConnected.fb ?? ob.connected.fb),
        ig: false
      }
    })
    void navigate({ to: '/onboarding/$step', params: { step: '4' } })
  }

  return (
    <div className="onb-col">
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
            {isBreak ? 'Optional: your accounts' : 'Your accounts'}
          </div>
          <div className="platform-list">
            {PLATFORMS.map((p) => {
              const on = Boolean(apiConnected[p.id])
              return (
                <div key={p.id} className="platform-row" data-on={p.soon ? undefined : on || undefined}>
                  <span className="platform-glyph" aria-hidden="true">
                    <PlatformMark platform={p.id} size={22} />
                  </span>
                  <span className="platform-text">
                    <span className="platform-name">{p.name}</span>
                    <span className="platform-sub">
                      {p.soon
                        ? 'Coming soon'
                        : on
                          ? 'Connected · reading followers & engagement'
                          : 'Not connected'}
                    </span>
                  </span>
                  <span className="conn-chip" data-on={p.soon ? undefined : on || undefined}>
                    {p.soon
                      ? 'Soon'
                      : on
                        ? 'Connected'
                        : 'Off'}
                  </span>
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
            placeholder="e.g. Afro-house fans in Accra"
            value={ob.niche}
            onChange={(e) => updateOnboarding({ niche: e.target.value })}
          />
        </section>
      </div>
      <div className="onb-nav onb-nav-lg">
        <button
          type="button"
          className="btn-text"
          onClick={() => navigate({ to: '/onboarding/$step', params: { step: '2' } })}
        >
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
    </div>
  )
}

export function ReadingStep() {
  const navigate = useNavigate()
  const ob = useOnboarding()
  const [prog, setProg] = useState(0)
  const readDone = useRef(false)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const anyConnected = PLATFORMS.some((p) => ob.connected[p.id])
  const nicheName = ob.niche.trim()

  const tasks = [
    anyConnected
      ? 'Reading followers and engagement'
      : `Profiling the ${nicheName || 'niche'} crowd`,
    ...READING_TASKS
  ]

  const advanced = useRef(false)

  useEffect(() => {
    // Kick the real Qloo read once per entry into this step.
    readDone.current = false
    updateOnboarding({ readFailed: false })
    let cancelled = false
    void readAudience(nicheName).then((r) => {
      if (cancelled) return
      updateOnboarding({ readFailed: r !== 'ok' })
      readDone.current = true
    })
    const iv = window.setInterval(() => {
      setProg((p) => {
        // Hold just short of the end until Qloo actually answers.
        const cap = readDone.current ? 1 : 0.92
        return Math.min(cap, p + 0.018)
      })
    }, 80)
    const list = timers.current
    return () => {
      cancelled = true
      clearInterval(iv)
      for (const t of list) clearTimeout(t)
    }
    // The guard pins goal/niche/connected for this step's lifetime.
  }, [])

  useEffect(() => {
    if (prog >= 1 && !advanced.current) {
      advanced.current = true
      later(() => void navigate({ to: '/onboarding/$step', params: { step: '5' } }), 500)
    }
  }, [prog, navigate])

  return (
    <div className="onb-col">
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
    </div>
  )
}

export function ProfileStep() {
  const navigate = useNavigate()
  const ob = useOnboarding()
  const ws = useWorkspace()

  const anyConnected = PLATFORMS.some((p) => ob.connected[p.id])
  const nicheName = ob.niche.trim()
  const loves = lovesFrom(ws.profile, LOVES)

  const openDashboard = () => {
    // Completion flag: lives in the workspace store so sign-out and owner
    // switches clear it, and the /_onboarding guard can read it synchronously.
    updateWorkspace({ onboarded: true })
    void navigate({ to: '/home' })
  }

  const startOver = () => {
    resetOnboarding()
    void navigate({
      to: '/onboarding/$step',
      params: { step: getSignedInUser() ? '2' : '1' }
    })
  }

  return (
    <div className="onb-col">
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
      {ob.readFailed && (
        <p className="quiet-note">
          Qloo didn't answer this time, so you're seeing a starter profile. You
          can refresh it from Audience.
        </p>
      )}
      <div className="onb-nav onb-nav-start">
        <button
          type="button"
          className="btn btn-primary btn-arrow"
          onClick={openDashboard}
        >
          Open my dashboard
          <span className="btn-arrow-dot" aria-hidden="true">
            <Icon name="arrow" size={14} stroke={2.2} />
          </span>
        </button>
        <button type="button" className="btn-text btn-text-u" onClick={startOver}>
          Start over
        </button>
      </div>
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
