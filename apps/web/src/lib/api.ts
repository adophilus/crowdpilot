import {
  createFetchClient,
  createTanstackQueryClient
} from '@crowdpilot/api-client'
import type { components } from '@crowdpilot/api-client-types'

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:1050'

export const api = createFetchClient(API_URL)
export const queryClient = createTanstackQueryClient(api)

export type Profile = components['schemas']['ProfileSuccess']
export type Evidence = components['schemas']['EvidenceSuccess']
export interface SessionUser {
  id: string
  email: string
}

const TOKEN_KEY = 'crowdpilot_token'
const USER_KEY = 'crowdpilot_user'

// Signed-in token wins; VITE_DEMO_TOKEN (seeded demo session) is the fallback
// that keeps the one-click demo persona free of signup friction.
export const getToken = (): string | null =>
  safeGet(TOKEN_KEY) ??
  (import.meta.env.VITE_DEMO_TOKEN as string | undefined ?? null)

export const getSignedInUser = (): SessionUser | null => {
  const raw = safeGet(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export const storeSession = (token: string, user: SessionUser): void => {
  safeSet(TOKEN_KEY, token)
  safeSet(USER_KEY, JSON.stringify(user))
}

export const clearSession = (): void => {
  safeRemove(TOKEN_KEY)
  safeRemove(USER_KEY)
}

export const bearer = (): { headers: Record<string, string> } => {
  const token = getToken()
  return token ? { headers: { Authorization: `Bearer ${token}` } } : { headers: {} }
}

// SSR-safe localStorage (TanStack Start renders on the server first)
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode etc. */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}
