import type { RadarValues } from '../components/ui'
import type { Profile } from './api'
import { RADAR_FALLBACK, TASTE_ITEMS, type TasteTab } from './fixtures'

// Maps the real Qloo profile onto the design's taste UI. Food has no Qloo
// domain in the profile endpoint yet, so it stays on fixture data.
const DOMAIN_FOR: Record<TasteTab, string | null> = {
  music: 'artist',
  food: null,
  places: 'place',
  brands: 'brand',
  film: 'movie'
}

const picksFor = (profile: Profile | null, tab: TasteTab) => {
  const domain = DOMAIN_FOR[tab]
  if (!profile || !domain) return []
  return profile.affinities.find((a) => a.domain === domain)?.picks ?? []
}

const avg = (xs: number[]) =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0

export const radarFrom = (profile: Profile | null): RadarValues => {
  if (!profile || profile.affinities.length === 0) return RADAR_FALLBACK
  const raw = {
    music: avg(picksFor(profile, 'music').map((p) => p.score)),
    places: avg(picksFor(profile, 'places').map((p) => p.score)),
    brands: avg(picksFor(profile, 'brands').map((p) => p.score)),
    film: avg(picksFor(profile, 'film').map((p) => p.score))
  }
  const max = Math.max(...Object.values(raw)) || 1
  const norm = (v: number) => (v > 0 ? 0.35 + 0.6 * (v / max) : 0.25)
  return {
    music: norm(raw.music),
    food: RADAR_FALLBACK.food,
    places: norm(raw.places),
    brands: norm(raw.brands),
    film: norm(raw.film)
  }
}

export interface TasteItem {
  name: string
  value: number
}

export const tasteItems = (
  profile: Profile | null,
  tab: TasteTab
): { items: TasteItem[]; live: boolean } => {
  const picks = picksFor(profile, tab)
  if (picks.length === 0) {
    return {
      items: TASTE_ITEMS[tab].map(([name, value]) => ({ name, value })),
      live: false
    }
  }
  const max = Math.max(...picks.map((p) => p.score)) || 1
  return {
    items: picks.map((p) => ({
      name: p.name,
      value: Math.max(
        30,
        Math.min(
          100,
          Math.round(p.score <= 1 ? p.score * 100 : (p.score / max) * 100)
        )
      )
    })),
    live: true
  }
}

export const levelOf = (v: number) =>
  v >= 85 ? 'Loves it' : v >= 65 ? 'Into it' : 'Curious'
