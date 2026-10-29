import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState
} from '@tanstack/react-router'
import { Wordmark } from '../components/ui'
import { getToken } from '../lib/api'
import { hasCompletedOnboarding } from '../lib/workspace'

// Pathless layout around the onboarding flow. Users who already finished
// onboarding land on the dashboard instead; the wizard state itself lives in
// lib/onboarding (sessionStorage) and the numbered-step guards live on
// onboarding.$step. The header (wordmark + step ring) lives HERE, keyed off
// the pathname: the layout stays mounted across /onboarding/1…5 navigations,
// so the ring's arc transitions instead of being torn down on every step.
export const Route = createFileRoute('/_onboarding')({
  ssr: false,
  beforeLoad: () => {
    if (getToken() && hasCompletedOnboarding()) {
      throw redirect({ to: '/home', replace: true })
    }
  },
  component: OnboardingLayout
})

function OnboardingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const stepMatch = /\/onboarding\/(\d)$/.exec(pathname)
  const step = stepMatch ? Number(stepMatch[1]) : null
  // Step 1 renders its own inline wordmark (onb-mark), so the header row
  // carries only the ring there; later steps get wordmark + ring.
  const isAccount = step === 1

  return (
    <div className="onb">
      <main className="onb-main">
        {step != null && (
          <header className="onb-head">
            {!isAccount && <Wordmark size={28} />}
            <StepProgress step={step} total={5} />
          </header>
        )}

        {/* Keyed by pathname so each step remounts and fades in fresh. */}
        <div className="onb-stage fade-in" key={pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// Circular step tracker, top-right: 40px ring, track in --line-2, progress
// arc in the accent color starting at 12 o'clock. The dashoffset transition
// animates because the layout never remounts between steps.
function StepProgress({ step, total }: { step: number; total: number }) {
  const r = 18
  const c = 2 * Math.PI * r
  return (
    <svg
      className="onb-ring"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      role="img"
      aria-label={`Step ${step} of ${total}`}
    >
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--line-2)" strokeWidth="3.5" />
      <circle
        className="onb-ring-arc"
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - step / total)}
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="central">
        <tspan className="onb-ring-n">{step}</tspan>
        <tspan className="onb-ring-t">/{total}</tspan>
      </text>
    </svg>
  )
}
