// FIXTURE BOUNDARY — everything in this file is local design data for parts of
// the product the backend doesn't serve yet (directions, plans, niches,
// accounts, settings). Each export is typed so it can be swapped for an API
// call later without touching the screens. Real Qloo data lives in the
// workspace store (lib/workspace.ts) and comes from POST /qloo/profile.

export type GoalId = 'break' | 'deep' | 'niche'
export type PlatformId = 'x' | 'fb' | 'ig'
// Onscript's own platform enum (POST /posts, /onscript/* payloads).
export type ApiPlatform = 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'
export type MatchFill = 100 | 60 | 35
export type BizType = 'venue' | 'creator' | 'brand' | 'events' | 'agency'
export type ToneId = 'warm' | 'playful' | 'local' | 'bold' | 'minimal'
export type SwitchId =
  | 'askPost'
  | 'autoSchedule'
  | 'digest'
  | 'niche'
  | 'planDone'
  | 'quiet'

export const matchLabel = (fill: MatchFill): string =>
  fill === 100 ? 'Strong match' : fill >= 60 ? 'Good match' : 'Possible match'

// ---- Onboarding ----

export interface GoalDef {
  id: GoalId
  title: string
  body: string
  icon: string
}

export const GOALS: GoalDef[] = [
  {
    id: 'break',
    title: 'Break into a niche',
    body: 'Win over a crowd you haven’t reached yet.',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'
  },
  {
    id: 'deep',
    title: 'Go deeper with my audience',
    body: 'Understand the people who already follow or visit you.',
    icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
  },
  {
    id: 'niche',
    title: 'Find the niches inside my audience',
    body: 'Spot the sub-scenes and crossover crowds worth growing into.',
    icon: 'M6 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM18 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 8.5v1.5a4 4 0 0 0 4 4h.5M18 8.5v1.5a4 4 0 0 1-4 4h-.5M12 14v1.5'
  }
]

// Honest platform list: Onscript ships these three only. Facebook +
// Instagram posting is paused (provider subscription lapsed) — shown disabled.
export const PLATFORMS: {
  id: PlatformId
  name: string
  short: string
  soon?: boolean
}[] = [
  { id: 'x', name: 'X (Twitter)', short: 'X' },
  { id: 'fb', name: 'Facebook', short: 'Facebook', soon: true },
  { id: 'ig', name: 'Instagram', short: 'Instagram', soon: true }
]

// Fixture id ↔ Onscript platform enum.
export const API_PLATFORM: Record<PlatformId, ApiPlatform> = {
  x: 'TWITTER',
  fb: 'FACEBOOK',
  ig: 'INSTAGRAM'
}

export const platformShort = (p: ApiPlatform): string =>
  PLATFORMS.find((x) => API_PLATFORM[x.id] === p)?.short ?? p

export const READING_TASKS = [
  'Mapping taste across 10 cultural domains',
  'Finding niches inside your crowd',
  'Preparing your first directions'
]

// Fallback "They love" chips when Qloo is unreachable.
// The Kofi's Café demo persona's crowd, sent to POST /qloo/profile.
export const DEMO_NICHE = 'alté and Afrobeats fans in Lagos'

export const LOVES = [
  'Afrobeats',
  'Street food',
  'Specialty coffee',
  'Thrift fashion',
  'Travel vlogs'
]

export const NICHES_FOUND = [
  'Afro-house nights',
  'Vintage & thrift pop-ups',
  'Spoken-word & poetry'
]

// ---- Audience ----

export const RADAR_FALLBACK = {
  music: 0.92,
  food: 0.84,
  places: 0.71,
  brands: 0.66,
  film: 0.5
}

export type TasteTab = 'music' | 'food' | 'places' | 'brands' | 'film'

export const TASTE_TABS: [TasteTab, string][] = [
  ['music', 'Music'],
  ['food', 'Food'],
  ['places', 'Places'],
  ['brands', 'Brands'],
  ['film', 'Film']
]

export const TASTE_ITEMS: Record<TasteTab, [string, number][]> = {
  music: [
    ['Alté', 100],
    ['Soft Afrobeats', 92],
    ['Highlife classics', 80],
    ['Amapiano', 72],
    ['Neo-soul', 64],
    ['Afro-house', 58]
  ],
  food: [
    ['Specialty coffee', 96],
    ['Jollof & small chops', 88],
    ['Suya', 80],
    ['Plant-based bowls', 66],
    ['Pastries & bakes', 60],
    ['Zobo & cold brews', 54]
  ],
  places: [
    ['Lekki cafés', 94],
    ['Yaba thrift markets', 84],
    ['Rooftop lounges', 74],
    ['Art galleries', 66],
    ['Beach clubs', 58],
    ['Co-working spaces', 50]
  ],
  brands: [
    ['Lagos streetwear labels', 90],
    ['Indie skincare', 78],
    ['Vinyl & record shops', 70],
    ['Craft drinks', 64],
    ['Sneaker resale', 58],
    ['Creator merch', 50]
  ],
  film: [
    ['New-wave Nollywood', 88],
    ['Indie films', 76],
    ['Music documentaries', 70],
    ['Anime', 60],
    ['K-dramas', 54],
    ['Stand-up specials', 48]
  ]
}

export const PILOT_READ =
  'A young, creative Lagos crowd that likes its weekends slow: soft Afrobeats, good coffee, thrift finds and street food with friends.'

export const TRAITS = [
  'Mostly 22–34',
  'Weekend brunchers',
  'Music-first',
  'Shops local',
  'Lekki & Yaba'
]

export interface NicheDef {
  name: string
  note: string
  size: string
  detail: string
  fill: MatchFill
}

export const NICHES: NicheDef[] = [
  {
    name: 'Afro-house nights',
    note: 'Growing fast in your crowd',
    size: 'Growing fast',
    detail:
      'Your Amapiano and alté fans are drifting toward late-night Afro-house sets.',
    fill: 100
  },
  {
    name: 'Vintage & thrift',
    note: 'Big overlap with your followers',
    size: 'Big overlap',
    detail:
      'Many of your followers also follow Yaba and Lekki thrift sellers.',
    fill: 60
  },
  {
    name: 'Spoken word & poetry',
    note: 'Small but loyal',
    size: 'Small but loyal',
    detail: 'A tight group that shows up for open mics and readings.',
    fill: 35
  }
]

// ---- Directions ----

export interface DirectionDef {
  id: string
  goal: GoalId
  kind: string
  fill: MatchFill
  title: string
  summary: string
  receipts: string[]
}

export const DIRECTIONS: DirectionDef[] = [
  {
    id: 'brunch',
    goal: 'deep',
    kind: 'Go deeper',
    fill: 100,
    title: 'Saturday Afrobeats brunch sessions',
    summary:
      'A weekly slow-morning session with a curated alté and soft Afrobeats playlist.',
    receipts: [
      'Your followers engage most with weekend-morning posts.',
      'Alté and soft Afrobeats top your audience’s music taste.',
      'Brunch spots are among the places they visit most.'
    ]
  },
  {
    id: 'afrohouse',
    goal: 'niche',
    kind: 'Find new niches',
    fill: 60,
    title: 'A monthly Afro-house night',
    summary:
      'A late-evening set for the fast-growing Afro-house crowd inside your audience.',
    receipts: [
      'Afro-house interest is rising among your Amapiano fans.',
      'Few nearby venues serve this crowd on weeknights.',
      'Craft drinks over-index with the same group.'
    ]
  },
  {
    id: 'students',
    goal: 'break',
    kind: 'Break into a niche',
    fill: 60,
    title: 'Win over Yaba’s student crowd',
    summary:
      'Study-friendly weekday deals, quiet corners and a lo-fi playlist.',
    receipts: [
      'Students near Yaba love affordable specialty coffee.',
      'Lo-fi and study playlists are big with this group.',
      'They share many favourite spots with your current crowd.'
    ]
  },
  {
    id: 'wall',
    goal: 'deep',
    kind: 'Go deeper',
    fill: 60,
    title: 'Let regulars vote on the playlist',
    summary:
      'A weekly poll where regulars pick the songs you play on Fridays.',
    receipts: [
      'Your audience comments on music posts more than any other kind.',
      'Polls get strong engagement from people with this taste profile.',
      'Builds a loop that brings regulars back each week.'
    ]
  },
  {
    id: 'thrift',
    goal: 'niche',
    kind: 'Find new niches',
    fill: 35,
    title: 'Thrift pop-up with a local label',
    summary:
      'Host a Saturday pop-up with a Yaba thrift seller and a matching playlist.',
    receipts: [
      'Many of your followers also follow Lagos thrift sellers.',
      'Thrift fans over-index on cafés like yours.',
      'A collab opens you to the seller’s own audience.'
    ]
  },
  {
    id: 'plant',
    goal: 'break',
    kind: 'Break into a niche',
    fill: 35,
    title: 'A plant-based menu for the wellness crowd',
    summary:
      'Two or three plant-based bowls to bring in Lagos’s wellness and run-club crowd.',
    receipts: [
      'Plant-based food is a smaller but growing interest nearby.',
      'Run clubs meet near Lekki on weekend mornings.',
      'This crowd overlaps with specialty-coffee fans.'
    ]
  }
]

// Home shows three of the directions with shorter, punchier copy.
export const HOME_DIRECTIONS: {
  id: string
  kind: string
  title: string
  why: string
  fill: MatchFill
}[] = [
  {
    id: 'brunch',
    kind: 'Go deeper',
    title: 'Saturday Afrobeats brunch sessions',
    why: 'Your regulars over-index on alté and soft Afrobeats, especially on weekend mornings.',
    fill: 100
  },
  {
    id: 'afrohouse',
    kind: 'New niche',
    title: 'A monthly Afro-house night',
    why: 'A fast-growing scene inside your crowd, with few nearby venues serving it.',
    fill: 60
  },
  {
    id: 'thrift',
    kind: 'Collab',
    title: 'Thrift pop-up with a local label',
    why: 'Your followers overlap strongly with vintage and thrift culture in Lagos.',
    fill: 35
  }
]

export const DIRECTION_FILTERS: ['all' | GoalId, string][] = [
  ['all', 'All'],
  ['break', 'Break into a niche'],
  ['deep', 'Go deeper'],
  ['niche', 'Find new niches']
]

// ---- Plans ----

export type StepState = 'done' | 'review' | 'todo' | 'sched'
export type PlanBase = 'ready' | 'scheduled' | 'drafting' | 'done'

export interface PlanDef {
  id: string
  kind: string
  title: string
  base: PlanBase
  whenLabel?: string
  why: string
  post: string
  steps: { title: string; detail: string; st: StepState }[]
}

export const PLANS: PlanDef[] = [
  {
    id: 'brunch',
    kind: 'Go deeper',
    title: 'Saturday Afrobeats brunch sessions',
    base: 'ready',
    why: 'Your regulars over-index on alté and soft Afrobeats, especially on weekend mornings.',
    post: 'Saturdays just got a soundtrack. Soft Afrobeats from 10am, pour-overs all day. Come slow, stay long.',
    steps: [
      { title: 'Build the brunch playlist', detail: '40 songs of alté and soft Afrobeats', st: 'done' },
      { title: 'Add a brunch note to the menu board', detail: 'Short line for the counter and table cards', st: 'done' },
      { title: 'Review the announcement post', detail: 'Drafted in your voice, below', st: 'review' },
      { title: 'Post to your accounts', detail: 'X and Facebook', st: 'todo' }
    ]
  },
  {
    id: 'morning',
    kind: 'Go deeper',
    title: 'Weekday morning playlist refresh',
    base: 'scheduled',
    whenLabel: 'Mon 09:00',
    why: 'Morning visitors respond best to calm highlife and neo-soul.',
    post: 'New week, new morning playlist. Highlife and neo-soul with your first cup.',
    steps: [
      { title: 'Refresh the morning playlist', detail: '25 songs of highlife and neo-soul', st: 'done' },
      { title: 'Swap the in-store playlist', detail: 'Takes effect Monday', st: 'done' },
      { title: 'Write the announcement post', detail: 'Approved by you', st: 'done' },
      { title: 'Post to your accounts', detail: 'Scheduled for Mon 09:00', st: 'sched' }
    ]
  },
  {
    id: 'afrohouse',
    kind: 'Find new niches',
    title: 'Monthly Afro-house night',
    base: 'drafting',
    why: 'A fast-growing scene inside your crowd, with few nearby venues serving it.',
    post: 'Last Friday of the month, the café turns into something else. Afro-house from 9pm. Details soon.',
    steps: [
      { title: 'Shortlist local Afro-house DJs', detail: 'Pilot is finding DJs your crowd already follows', st: 'todo' },
      { title: 'Plan a late-night drinks menu', detail: 'Craft drinks and zobo-based mocktails', st: 'todo' },
      { title: 'Review the teaser post', detail: 'Drafted in your voice, below', st: 'review' },
      { title: 'Post to your accounts', detail: 'X and Facebook', st: 'todo' }
    ]
  },
  {
    id: 'wall',
    kind: 'Go deeper',
    title: 'Regulars vote on the Friday playlist',
    base: 'done',
    why: 'Your audience comments on music posts more than any other kind.',
    post: '',
    steps: [
      { title: 'Set up the weekly poll', detail: 'Four songs to choose from', st: 'done' },
      { title: 'Post the poll', detail: 'Went out on X and Facebook', st: 'done' },
      { title: 'Add the winners to Friday’s playlist', detail: 'Done automatically', st: 'done' },
      { title: 'Thank voters', detail: 'Short thank-you post', st: 'done' }
    ]
  }
]

// A direction picked with Proceed that has no hand-written plan gets this
// drafting skeleton until the backend can generate real steps.
export const draftPlanFor = (d: DirectionDef): PlanDef => ({
  id: d.id,
  kind: d.kind,
  title: d.title,
  base: 'drafting',
  why: d.receipts[0] ?? d.summary,
  post: '',
  steps: [
    { title: 'Pilot is drafting the steps', detail: d.summary, st: 'todo' },
    { title: 'Review the plan', detail: 'You’ll get a say before anything runs', st: 'todo' },
    { title: 'Write the announcement post', detail: 'Drafted in your voice', st: 'todo' },
    { title: 'Post to your accounts', detail: 'X and Facebook', st: 'todo' }
  ]
})

// ---- Pilot chat ----

export const PILOT_INTRO_DEMO = [
  'Hey Kofi. Your regulars have been leaning into Afro-house this month, more than most Lagos café crowds.',
  'I’ve lined up three directions below. Saturday brunch sessions is the strongest match. Want me to draft that plan?'
]

export const pilotIntro = (first: string): string[] => [
  `Hey ${first}. I’ve read your audience and I can dig into anything in it.`,
  'Ask me what to play, stock or post next. Every answer cites the Qloo data behind it.'
]

// ---- Accounts ----

export const DEFAULT_SYNCED: Record<PlatformId, string> = {
  x: '',
  fb: '',
  ig: ''
}

export const DEFAULT_TRACKED = [
  'Plant-based foodies in Lagos',
  'Students around Yaba'
]

// ---- Settings ----

export const BIZ_TYPES: [BizType, string][] = [
  ['venue', 'Venue or shop'],
  ['creator', 'Creator'],
  ['brand', 'Brand'],
  ['events', 'Event organizer'],
  ['agency', 'Agency']
]

export const TONES: [ToneId, string, string][] = [
  ['warm', 'Warm', 'Come slow, stay long. Soft Afrobeats and pour-overs from 10am this Saturday.'],
  ['playful', 'Playful', 'Your Saturday called. It wants Afrobeats and a flat white.'],
  ['local', 'Local', 'Lekki, your brunch spot just got a soundtrack. See you Saturday.'],
  ['bold', 'Bold', 'Saturdays. Afrobeats. 10am. Be there.'],
  ['minimal', 'Minimal', 'Brunch sessions. Saturday, 10am.']
]

export const SWITCH_GROUPS: {
  title: string
  items: [SwitchId, string, string][]
}[] = [
  {
    title: 'Approvals',
    items: [
      ['askPost', 'Ask before every post', 'Nothing goes out until you approve it.'],
      ['autoSchedule', 'Let Pilot pick posting times', 'Pilot schedules approved posts for when your audience is most active.']
    ]
  },
  {
    title: 'Notifications',
    items: [
      ['digest', 'Weekly directions digest', 'Every Monday, your best new directions.'],
      ['niche', 'New niche spotted', 'When a new crowd starts forming in your audience.'],
      ['planDone', 'Plan finished', 'When a plan has fully run.']
    ]
  }
]

export const DEFAULT_SWITCHES: Record<SwitchId, boolean> = {
  askPost: true,
  autoSchedule: false,
  digest: true,
  niche: true,
  planDone: true,
  quiet: false
}

export const DEMO_BUSINESS = {
  name: "Kofi's Café",
  city: 'Lagos',
  type: 'venue' as BizType,
  owner: 'Kofi'
}
