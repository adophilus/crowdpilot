import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { API_URL, storeSession } from '../lib/api'
import { claimWorkspace, hasCompletedOnboarding } from '../lib/workspace'

export const Route = createFileRoute('/auth/callback')({
  ssr: false,
  component: AuthCallback
})

// Lands here from the backend's Google OAuth redirect:
// /auth/callback#token=<session token> or /auth/callback#error=google_failed.
function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const hash = new URLSearchParams(
      window.location.hash.replace(/^#/, '')
    )
    const token = hash.get('token')
    if (hash.get('error') || !token) {
      setError('Google sign-in didn’t complete. Please try again.')
      return
    }
    // The shared fetch client has no auth interceptor, so /auth/me is called
    // directly; once the session is stored the regular client picks it up.
    let cancelled = false
    void fetch(`${API_URL}/auth/me`, {
      headers: { authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`me failed: ${res.status}`)
        const data = (await res.json()) as { user: { id: string; email: string } }
        if (cancelled) return
        storeSession(token, data.user)
        claimWorkspace({ email: data.user.email })
        setDone(true)
        // Returning users who already finished onboarding go straight in.
        navigate({ to: hasCompletedOnboarding() ? '/home' : '/onboarding/goal' })
      })
      .catch(() => {
        if (!cancelled) setError('Your Google session couldn’t be verified. Please try again.')
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="onb">
      <main className="onb-main">
        <div className="onb-col" style={{ textAlign: 'center' }}>
          {error ? (
            <>
              <h1 className="onb-title">Sign-in hit a snag.</h1>
              <p className="onb-lede">{error}</p>
              <Link to="/onboarding/account" className="btn btn-primary">
                Back to sign-in
              </Link>
            </>
          ) : (
            <>
              <h1 className="onb-title">{done ? 'Almost there…' : 'Signing you in…'}</h1>
              <p className="onb-lede">
                {done
                  ? hasCompletedOnboarding()
                    ? 'Taking you to your workspace.'
                    : 'Taking you back to onboarding.'
                  : 'Finishing up with Google.'}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
