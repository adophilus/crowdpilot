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
// lib/onboarding (sessionStorage) and the per-step guards live on the children.
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
  const isAccount = pathname.endsWith('/account')

  return (
    <div className="onb">
      <main className="onb-main">
        {!isAccount && (
          <header className="onb-head">
            <Wordmark size={28} />
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
