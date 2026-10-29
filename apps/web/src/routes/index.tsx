import { createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '../lib/api'
import { hasCompletedOnboarding } from '../lib/workspace'

// The token lives in localStorage, so this decision only makes sense on the
// client. Signed-out visitors start at the account step; signed-in users who
// already finished onboarding go straight to the dashboard, everyone else
// resumes at the goal step.
export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: '/onboarding/$step', params: { step: '1' }, replace: true })
    }
    if (hasCompletedOnboarding()) {
      throw redirect({ to: '/home', replace: true })
    }
    throw redirect({ to: '/onboarding/$step', params: { step: '2' }, replace: true })
  }
})
