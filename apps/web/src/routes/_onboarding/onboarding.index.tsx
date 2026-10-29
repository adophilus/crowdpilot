import { createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '../../lib/api'

// /onboarding — entry point for the numbered funnel. Fresh visitors start at
// the account step; anyone with a session resumes at the goal step.
export const Route = createFileRoute('/_onboarding/onboarding/')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({
      to: '/onboarding/$step',
      params: { step: getToken() ? '2' : '1' },
      replace: true
    })
  }
})
