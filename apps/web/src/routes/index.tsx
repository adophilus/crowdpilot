import { createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '../lib/api'

// The token lives in localStorage, so this decision only makes sense on the
// client.
export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: getToken() ? '/home' : '/onboarding', replace: true })
  }
})
