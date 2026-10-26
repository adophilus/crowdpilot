import { useSyncExternalStore } from 'react'
import { api, bearer, type Profile } from './api'
import {
  type BizType,
  DEFAULT_SWITCHES,
  DEFAULT_SYNCED,
  DEFAULT_TRACKED,
  DEMO_BUSINESS,
  type GoalId,
  type PlatformId,
  type ProfileSeed,
  type SwitchId,
  type ToneId
} from './fixtures'

// Client-side workspace store. The real Qloo profile (POST /qloo/profile) is
// cached here so Home, Audience and onboarding share one read; everything
// else is local UI state seeded from fixtures until the backend grows the
// matching endpoints.

export type Pick = 'taken' | 'skip'

export interface WorkspaceState {
  owner: string | null
  // Set when the user finishes onboarding ("Open my dashboard"). Lives here so
  // sign-out (resetWorkspace) and a different owner (claimWorkspace) clear it.
  onboarded: boolean
  business: { name: string; city: string; type: BizType; first: string }
  goal: GoalId | null
  niche: string
  seed: ProfileSeed | null
  profile: Profile | null
  profileUpdatedAt: number | null
  profileError: boolean
  picks: Record<string, Pick>
  connected: Record<PlatformId, boolean>
  synced: Record<PlatformId, string>
  tracked: string[]
  tones: Partial<Record<ToneId, boolean>>
  lastTone: ToneId
  switches: Record<SwitchId, boolean>
}

const KEY = 'crowdpilot_workspace'

const blank = (): WorkspaceState => ({
  owner: null,
  onboarded: false,
  business: { ...DEMO_BUSINESS, first: DEMO_BUSINESS.owner },
  goal: null,
  niche: '',
  seed: null,
  profile: null,
  profileUpdatedAt: null,
  profileError: false,
  picks: {},
  connected: { x: true, fb: true, tt: true },
  synced: { ...DEFAULT_SYNCED },
  tracked: [...DEFAULT_TRACKED],
  tones: { warm: true, local: true },
  lastTone: 'warm',
  switches: { ...DEFAULT_SWITCHES }
})

const DEFAULT = blank()

const load = (): WorkspaceState => {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...blank(), ...(JSON.parse(raw) as Partial<WorkspaceState>) }
  } catch {
    return DEFAULT
  }
}

let state: WorkspaceState = load()
const listeners = new Set<() => void>()

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode etc. */
  }
}

export const getWorkspace = (): WorkspaceState => state

export const updateWorkspace = (
  patch:
    | Partial<WorkspaceState>
    | ((s: WorkspaceState) => Partial<WorkspaceState>)
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

export const useWorkspace = (): WorkspaceState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => DEFAULT
  )

// Switch identity: demo persona gets Kofi's Café; a signed-in email gets a
// fresh workspace named after them. Same owner keeps everything.
export const claimWorkspace = (owner: 'demo' | { email: string }): void => {
  const id = owner === 'demo' ? 'demo' : owner.email
  if (state.owner === id) return
  const fresh = blank()
  if (owner !== 'demo') {
    const local = owner.email.split('@')[0] ?? 'there'
    const first =
      local.split(/[._-]/)[0]?.replace(/^\w/, (c) => c.toUpperCase()) ||
      'there'
    fresh.business = { name: `${first}'s workspace`, city: '', type: 'venue', first }
    fresh.connected = { x: false, fb: false, tt: false }
    fresh.tracked = []
  }
  state = { ...fresh, owner: id }
  persist()
  for (const l of listeners) l()
}

export const resetWorkspace = (): void => {
  state = blank()
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
  for (const l of listeners) l()
}

export type ReadResult = 'ok' | 'unauthorized' | 'error'

// Finished onboarding = explicitly clicked "Open my dashboard" (the flag), or
// a real Qloo profile is already cached for this workspace.
export const hasCompletedOnboarding = (): boolean =>
  state.onboarded || Boolean(state.profile)

// The real Qloo read. Falls back gracefully: on failure the screens keep any
// earlier profile (or fixtures) and flag profileError.
export const readAudience = async (seed: ProfileSeed): Promise<ReadResult> => {
  updateWorkspace({ seed })
  try {
    const { data, error, response } = await api.POST('/qloo/profile', {
      ...bearer(),
      body: {
        entityIds: seed.entityIds,
        ...(seed.tagIds ? { tagIds: seed.tagIds } : {})
      }
    })
    if (error || !data) {
      updateWorkspace({ profileError: true })
      return response.status === 401 ? 'unauthorized' : 'error'
    }
    updateWorkspace({
      profile: data,
      profileUpdatedAt: Date.now(),
      profileError: false
    })
    return 'ok'
  } catch {
    updateWorkspace({ profileError: true })
    return 'error'
  }
}

export const relativeTime = (ts: number | null): string => {
  if (!ts) return 'Updated 2 hours ago'
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'Updated just now'
  if (mins < 60) return `Updated ${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `Updated ${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

const titleCase = (s: string) =>
  s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// "They love" chips from the real profile's top tags.
export const lovesFrom = (profile: Profile | null, fallback: string[]) => {
  const tags = profile?.topTags.map((t) => titleCase(t.tag)).filter(Boolean)
  return tags && tags.length > 0 ? tags.slice(0, 6) : fallback
}
