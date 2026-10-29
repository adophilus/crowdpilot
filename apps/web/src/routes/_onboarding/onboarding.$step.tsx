import { createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '../../lib/api'
import { PLATFORMS } from '../../lib/fixtures'
import { getOnboarding } from '../../lib/onboarding'
import { hasCompletedOnboarding } from '../../lib/workspace'
import {
  AccountStep,
  ConnectStep,
  GoalStep,
  ProfileStep,
  ReadingStep
} from './-components/steps'

/* /onboarding/1 … /onboarding/5 — the numbered onboarding steps.
     1  account (email code / Google)   pre-auth
     2  goal                            session required
     3  connect accounts / niche
     4  reading (real Qloo read)
     5  profile (result + dashboard)

   One route for all of them on purpose: moving between steps navigates
   within the same route, so the layout (header + step ring) stays mounted
   and only the step component swaps. Step state lives in lib/onboarding. */

const STEPS = ['1', '2', '3', '4', '5'] as const
type StepParam = (typeof STEPS)[number]

export const Route = createFileRoute('/_onboarding/onboarding/$step')({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (!(STEPS as readonly string[]).includes(params.step)) {
      throw redirect({ to: '/onboarding', replace: true })
    }
    const step = params.step as StepParam
    // Finished onboarding already? Straight to the dashboard.
    if (getToken() && hasCompletedOnboarding()) {
      throw redirect({ to: '/home', replace: true })
    }
    if (step === '1') {
      // Signed-in users have no business on the account step.
      if (getToken()) {
        throw redirect({ to: '/onboarding/$step', params: { step: '2' }, replace: true })
      }
      return
    }
    // Every later step needs a session.
    if (!getToken()) {
      throw redirect({ to: '/onboarding/$step', params: { step: '1' }, replace: true })
    }
    // Reading/profile need something to read: a goal, a niche or a connection.
    if (step === '4' || step === '5') {
      const ob = getOnboarding()
      const anyConnected = PLATFORMS.some((p) => ob.connected[p.id])
      if (!ob.goal && !ob.niche.trim() && !anyConnected) {
        throw redirect({ to: '/onboarding/$step', params: { step: '3' }, replace: true })
      }
    }
  },
  component: StepRoute
})

function StepRoute() {
  const { step } = Route.useParams()

  if (step === '1') return <AccountStep />
  if (step === '2') return <GoalStep />
  if (step === '3') return <ConnectStep />
  if (step === '4') return <ReadingStep />
  return <ProfileStep />
}
