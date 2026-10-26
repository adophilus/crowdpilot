import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui'
import { getToken } from '../../lib/api'
import { NICHE_CHIPS, PLATFORMS, type PlatformId } from '../../lib/fixtures'
import { updateOnboarding, useOnboarding } from '../../lib/onboarding'
import { updateWorkspace } from '../../lib/workspace'

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
  const [connecting, setConnecting] = useState<PlatformId | null>(null)
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

  const isBreak = ob.goal === 'break'
  const anyConnected = PLATFORMS.some((p) => ob.connected[p.id])
  const nicheName = ob.niche.trim()

  const startRead = () => {
    updateWorkspace({
      goal: ob.goal,
      niche: nicheName,
      connected: {
        x: Boolean(ob.connected.x),
        fb: Boolean(ob.connected.fb),
        tt: Boolean(ob.connected.tt)
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
            {isBreak ? 'Optional: connect your accounts' : 'Your accounts'}
          </div>
          <div className="platform-list">
            {PLATFORMS.map((p) => {
              const on = Boolean(ob.connected[p.id])
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
                        updateOnboarding((s) => ({
                          connected: { ...s.connected, [p.id]: false }
                        }))
                        return
                      }
                      setConnecting(p.id)
                      later(() => {
                        setConnecting(null)
                        updateOnboarding((s) => ({
                          connected: { ...s.connected, [p.id]: true }
                        }))
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
