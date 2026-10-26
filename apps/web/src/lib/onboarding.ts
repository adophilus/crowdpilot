import { useSyncExternalStore } from 'react'
import type { GoalId, PlatformId } from './fixtures'

// Onboarding wizard state, shared across the /onboarding/* child routes and
// read imperatively in beforeLoad guards. Persisted to sessionStorage so a
// refresh mid-flow keeps the in-flight selections (the old single-route
// wizard lost everything on refresh). Cleared when onboarding completes or
// the user starts over.
export interface OnboardingState {
  authStep: 'email' | 'code'
  email: string
  code: string
  goal: GoalId | null
  niche: string
  connected: Partial<Record<PlatformId, boolean>>
  readFailed: boolean
}

const KEY = 'crowdpilot_onboarding'

const blank = (): OnboardingState => ({
  authStep: 'email',
  email: '',
  code: '',
  goal: null,
  niche: '',
  connected: {},
  readFailed: false
})

const DEFAULT = blank()

const load = (): OnboardingState => {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...blank(), ...(JSON.parse(raw) as Partial<OnboardingState>) }
  } catch {
    return DEFAULT
  }
}

let state: OnboardingState = load()
const listeners = new Set<() => void>()

const persist = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode etc. */
  }
}

export const getOnboarding = (): OnboardingState => state

export const updateOnboarding = (
  patch:
    | Partial<OnboardingState>
    | ((s: OnboardingState) => Partial<OnboardingState>)
): void => {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  persist()
  for (const l of listeners) l()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export const useOnboarding = (): OnboardingState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => DEFAULT
  )

export const resetOnboarding = (): void => {
  state = blank()
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
  for (const l of listeners) l()
}
