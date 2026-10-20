import { useEffect, useRef, useState } from 'react'
import { api, storeSession, type SessionUser } from '../lib/api'

export function AuthPanel({
  onClose,
  onSignedIn,
  note
}: {
  onClose: () => void
  onSignedIn: (user: SessionUser) => void
  note?: string | null
}) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
    else emailRef.current?.focus()
  }, [step])

  const requestCode = async () => {
    setError(null)
    if (!/.+@.+\..+/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    const { error: apiError } = await api.POST('/auth/request-code', {
      body: { email: email.trim() }
    })
    setBusy(false)
    if (apiError) {
      setError(errorMessage(apiError) ?? "Couldn't send the code — try again.")
      return
    }
    setStep('code')
  }

  const verify = async () => {
    setError(null)
    if (!/^\d{6}$/.test(code.trim())) {
      setError('The code is 6 digits.')
      return
    }
    setBusy(true)
    const { data, error: apiError } = await api.POST('/auth/verify', {
      body: { email: email.trim(), code: code.trim() }
    })
    setBusy(false)
    if (apiError || !data) {
      setError(
        apiError && 'InvalidOrExpiredCodeError' in apiError
          ? "That code didn't match — check the email and try again."
          : (errorMessage(apiError) ?? 'Verification failed — try again.')
      )
      return
    }
    storeSession(data.token, data.user)
    onSignedIn(data.user)
  }

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to CrowdPilot"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-wrap">
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <div className="modal">
          <p className="eyebrow">Sign in</p>
          {step === 'email' ? (
            <>
              <h3>Your crowd is waiting</h3>
              <p className="sub">We'll email you a 6-digit code. No password, no fuss.</p>
              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@yourcafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !busy && requestCode()}
                  ref={emailRef}
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="button" className="btn btn-solid" style={{ width: '100%', justifyContent: 'center' }} disabled={busy} onClick={requestCode}>
                {busy ? 'Sending…' : 'Email me a code'}
              </button>
              {note && <p className="modal-note">{note}</p>}
            </>
          ) : (
            <>
              <h3>Check your inbox</h3>
              <p className="sub">
                Sent to <strong>{email.trim()}</strong> — it expires in 10 minutes.
              </p>
              <div className="field">
                <label htmlFor="auth-code">Code</label>
                <input
                  ref={codeRef}
                  id="auth-code"
                  className="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="······"
                  value={code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(digits)
                    if (digits.length === 6) void verify()
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !busy && verify()}
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="button" className="btn btn-solid" style={{ width: '100%', justifyContent: 'center' }} disabled={busy} onClick={verify}>
                {busy ? 'Checking…' : 'Verify & enter'}
              </button>
              <button type="button" className="linkish" style={{ marginTop: 10, width: '100%' }} onClick={() => { setStep('email'); setError(null) }}>
                Use a different email
              </button>
            </>
          )}
        </div>
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
