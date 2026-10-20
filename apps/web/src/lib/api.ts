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

// Signed-in token wins. The one-click demo persona mints its own session from
// the public POST /demo/session (rate limited 10/IP/hour — cached for the
// tab's lifetime after first mint).
let cachedDemoToken: string | null = null

export const ensureDemoSession = async (): Promise<string | null> => {
  if (cachedDemoToken) return cachedDemoToken
  try {
    const res = await fetch(`${API_URL}/demo/session`, { method: 'POST' })
    if (!res.ok) return null
    const data = (await res.json()) as { token: string }
    cachedDemoToken = data.token
    return cachedDemoToken
  } catch {
    return null
  }
}

// A 401 on a demo call means the minted session died — drop the cache so the
// next demo click mints a fresh one.
export const resetDemoSession = (): void => {
  cachedDemoToken = null
}

export const getToken = (): string | null => safeGet(TOKEN_KEY) ?? cachedDemoToken

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
