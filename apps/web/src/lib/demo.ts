// Lagos demo persona — "Kofi's café". Entity ids mirror the fixture table in
// apps/backend/src/features/qloo/service/mock.ts (swap freely when Qloo goes live).
export const DEMO_CROWD = {
  name: "Kofi's crowd",
  place: 'Lagos',
  entityIds: [
    'urn:entity:artist:burna-boy',
    'urn:entity:artist:kabza-de-small',
    'urn:entity:artist:fela-kuti',
    'urn:entity:artist:asake',
    'urn:entity:brand:cafe-neo',
    'urn:entity:place:terra-kulture'
  ]
}

export const DEMO_WELCOME =
  "Welcome to Kofi's café in Lagos ☕\n\nI've mapped your crowd from Qloo — afrobeats and amapiano people who rate specialty coffee and West African food spots. Ask me what to play this weekend, what to stock, or to draft a post about Saturday."

export const DEMO_SUGGESTIONS = [
  'What should I play this weekend?',
  'Draft an IG post about Saturday',
  "What's happening near me worth sponsoring?"
]

export const OWN_SUGGESTIONS = [
  'My crowd loves indie rock and natural wine — build my profile',
  'What should I play this weekend?',
  'Draft an IG post about our weekend opening hours'
]
