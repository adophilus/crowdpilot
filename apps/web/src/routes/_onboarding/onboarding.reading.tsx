import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui'
import { getToken } from '../../lib/api'
import { PLATFORMS, READING_TASKS, seedFor } from '../../lib/fixtures'
import { getOnboarding, updateOnboarding, useOnboarding } from '../../lib/onboarding'
import { readAudience } from '../../lib/workspace'

export const Route = createFileRoute('/_onboarding/onboarding/reading')({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/onboarding/account', replace: true })
    const ob = getOnboarding()
    const anyConnected = PLATFORMS.some((p) => ob.connected[p.id])
    if (!ob.goal && !ob.niche.trim() && !anyConnected) {
      throw redirect({ to: '/onboarding/connect', replace: true })
    }
  },
  component: OnboardingReading
})

function OnboardingReading() {
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
    void readAudience(seedFor(nicheName)).then((r) => {
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
      later(() => void navigate({ to: '/onboarding/profile' }), 500)
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
