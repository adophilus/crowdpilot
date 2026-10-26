import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { GoogleMark, Wordmark } from '../../components/ui'
import { API_URL, api, getToken, storeSession } from '../../lib/api'
import {
  updateOnboarding,
  useOnboarding
} from '../../lib/onboarding'
import { claimWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_onboarding/onboarding/account')({
  ssr: false,
  beforeLoad: () => {
    // Signed-in users have no business on the account step.
    if (getToken()) throw redirect({ to: '/onboarding/goal', replace: true })
  },
  component: OnboardingAccount
})

const SITE = 'https://crowdpilot.hackathons.adophilus.com'

function OnboardingAccount() {
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
      void navigate({ to: '/onboarding/goal' })
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

function errorMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m) return m
  }
  return null
}
