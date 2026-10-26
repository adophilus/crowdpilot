import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api, bearer, getToken } from '../../lib/api'
import {
  API_PLATFORM,
  NICHE_CHIPS,
  PLATFORMS
} from '../../lib/fixtures'
import { updateOnboarding, useOnboarding } from '../../lib/onboarding'
import { updateWorkspace } from '../../lib/workspace'
import { Icon } from '../../components/ui'

export const Route = createFileRoute('/_onboarding/onboarding/connect')({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/onboarding/account', replace: true })
  },
  component: OnboardingConnect
})

function OnboardingConnect() {
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
    void navigate({ to: '/onboarding/reading' })
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
                <div key={p.id} className="platform-row" data-on={on || undefined}>
                  <span className="platform-glyph" aria-hidden="true">
                    <span />
                  </span>
                  <span className="platform-text">
                    <span className="platform-name">{p.name}</span>
                    <span className="platform-sub">
                      {p.mediaOnly
                        ? 'Needs media uploads — soon'
                        : on
                          ? 'Connected · reading followers & engagement'
                          : 'Not connected'}
                    </span>
                  </span>
                  <span className="conn-chip" data-on={on || undefined}>
                    {on ? 'Connected' : p.mediaOnly ? 'Soon' : 'Off'}
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
          <p className="quiet-note">
            Connect your own accounts on the Accounts page after setup — you can
            post via CrowdPilot's shared demo account either way.
          </p>
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
            value={ob.niche}
            onChange={(e) => updateOnboarding({ niche: e.target.value })}
          />
          <div className="chip-row">
            {NICHE_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                onClick={() => updateOnboarding({ niche: c })}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="onb-nav onb-nav-lg">
        <button
          type="button"
          className="btn-text"
          onClick={() => navigate({ to: '/onboarding/goal' })}
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
