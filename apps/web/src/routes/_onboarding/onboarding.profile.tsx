import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Icon } from '../../components/ui'
import { getToken, getSignedInUser } from '../../lib/api'
import { LOVES, NICHES_FOUND, PLATFORMS } from '../../lib/fixtures'
import { getOnboarding, resetOnboarding, useOnboarding } from '../../lib/onboarding'
import { lovesFrom, updateWorkspace, useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_onboarding/onboarding/profile')({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/onboarding/account', replace: true })
    const ob = getOnboarding()
    const anyConnected = PLATFORMS.some((p) => ob.connected[p.id])
    if (!ob.goal && !ob.niche.trim() && !anyConnected) {
      throw redirect({ to: '/onboarding/connect', replace: true })
    }
  },
  component: OnboardingProfile
})

function OnboardingProfile() {
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
      to: getSignedInUser() ? '/onboarding/goal' : '/onboarding/account'
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
