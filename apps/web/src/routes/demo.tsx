import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LogoMark } from '../components/ui'
import { ensureDemoSession, getSignedInUser } from '../lib/api'
import { DEMO_SEED } from '../lib/fixtures'
import { claimWorkspace, readAudience } from '../lib/workspace'

// Contract: the marketing site's "See it in action" CTA links here. Mints a
// demo session, opens Kofi's Café and lands on Home.
export const Route = createFileRoute('/demo')({
  ssr: false,
  component: DemoPage
})

function DemoPage() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setFailed(false)
    ;(async () => {
      // A signed-in user keeps their own workspace.
      if (getSignedInUser()) {
        void navigate({ to: '/home', replace: true })
        return
      }
      const token = await ensureDemoSession()
      if (!live) return
      if (!token) {
        setFailed(true)
        return
      }
      claimWorkspace('demo')
      // Fire the real Qloo read; Home renders fixtures until it lands.
      void readAudience(DEMO_SEED)
      void navigate({ to: '/home', replace: true })
    })()
    return () => {
      live = false
    }
  }, [attempt])

  return (
    <div className="splash">
      <div className={`splash-mark${failed ? '' : ' is-spinning'}`}>
        <LogoMark size={56} />
      </div>
      {failed ? (
        <>
          <h1 className="splash-title">The demo didn't open.</h1>
          <p className="splash-sub">
            The API might be waking up. Give it a second and try again.
          </p>
          <div className="splash-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </button>
            <Link to="/onboarding" className="btn-text">
              Create an account instead
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="splash-title">Opening Kofi's Café…</h1>
          <p className="splash-sub">A Lagos café, read by Qloo. No sign-up needed.</p>
        </>
      )}
    </div>
  )
}
