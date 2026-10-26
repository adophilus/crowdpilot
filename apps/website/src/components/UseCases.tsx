import { type KeyboardEvent, useState } from 'react'
import { GET_STARTED_URL } from '../lib/links'
import { Cta } from './Cta'
import { ICONS, Icon } from './Icon'

const CASES = [
  {
    id: 'creators',
    name: 'Creators',
    icon: 'M3 7h12v10H3zM15 10l6-3v10l-6-3z',
    headline: 'Grow a following that actually gets you.',
    t: [
      'Find the content angles a new niche already loves, before you post.',
      'Know what your followers watch, eat and listen to, and make more of it.',
      'Spot crossover audiences and the creators worth collaborating with.'
    ]
  },
  {
    id: 'venues',
    name: 'Venues & shops',
    icon: 'M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6',
    headline: 'Turn regulars into a community.',
    t: [
      'Win over a new neighbourhood crowd with the right menu and vibe.',
      'Playlists, specials and events your regulars will feel were made for them.',
      'Theme nights for the sub-scenes hiding inside your crowd.'
    ]
  },
  {
    id: 'brands',
    name: 'Brands',
    icon: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
    headline: 'Launch where your customers already are.',
    t: [
      'Test a new market’s taste before you spend on it.',
      'Campaigns that speak your customers’ cultural language.',
      'Find the scenes and partners your customers already love.'
    ]
  },
  {
    id: 'events',
    name: 'Event organizers',
    icon: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4',
    headline: 'Fill the room with the right people.',
    t: [
      'Programme for a crowd you haven’t reached yet.',
      'Lineups and themes your audience will actually show up for.',
      'Sponsors and side-events that fit the crowd.'
    ]
  },
  {
    id: 'agencies',
    name: 'Agencies',
    icon: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
    headline: 'Culture briefs your clients can act on.',
    t: [
      'Map a client’s target niche in minutes, not weeks.',
      'Taste profiles for every client segment, with the evidence attached.',
      'Surface adjacent audiences worth pitching next.'
    ]
  }
]

const GOALS = [
  { goal: 'Break into a niche', icon: ICONS.target },
  { goal: 'Go deeper with your audience', icon: ICONS.heart },
  { goal: 'Find the niches inside your niche', icon: ICONS.niches }
]

export function UseCases() {
  const [sel, setSel] = useState('creators')
  const cur = CASES.find((c) => c.id === sel) ?? CASES[0]

  // On narrow screens the tabs become a sideways scroller; keep the chosen
  // one fully visible.
  const select = (id: string) => {
    setSel(id)
    document.getElementById(`uc-tab-${id}`)?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth'
    })
  }

  const onKey = (e: KeyboardEvent, i: number) => {
    const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight'
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    if (!fwd && !back) return
    e.preventDefault()
    const next = CASES[(i + (fwd ? 1 : CASES.length - 1)) % CASES.length]
    select(next.id)
    document.getElementById(`uc-tab-${next.id}`)?.focus({ preventScroll: true })
  }

  return (
    <section id="crowds" className="section crowds" aria-labelledby="crowds-h">
      <div className="section-head">
        <span className="pill">Use cases</span>
        <h2 id="crowds-h" className="h2">
          Built for anyone growing an audience
        </h2>
        <p className="lede">
          Venues, creators, brands and organizers. Different crowds, the same
          three goals.
        </p>
      </div>
      <div className="uc-wrap">
        <div className="uctabs" role="tablist" aria-label="Who it's for">
          {CASES.map((c, i) => {
            const on = c.id === cur.id
            return (
              <button
                key={c.id}
                id={`uc-tab-${c.id}`}
                type="button"
                role="tab"
                className="uctab"
                aria-selected={on}
                aria-controls="uc-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => select(c.id)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="uctab__icon">
                  <Icon d={c.icon} size={20} />
                </span>
                <span>{c.name}</span>
              </button>
            )
          })}
        </div>
        <div
          id="uc-panel"
          className="ucpanel"
          role="tabpanel"
          aria-labelledby={`uc-tab-${cur.id}`}
        >
          <div key={cur.id} className="fade-in">
            <div className="ucpanel__for">For {cur.name.toLowerCase()}</div>
            <h3 className="ucpanel__title">{cur.headline}</h3>
          </div>
          <div key={`${cur.id}-goals`} className="fade-in">
            {GOALS.map((g, i) => (
              <div key={g.goal} className="ucgoal">
                <span className="ucgoal__icon">
                  <Icon d={g.icon} size={22} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="ucgoal__goal">{g.goal}</div>
                  <div className="ucgoal__text">{cur.t[i]}</div>
                </div>
              </div>
            ))}
          </div>
          <Cta href={GET_STARTED_URL} size="md">
            Get Started
          </Cta>
        </div>
      </div>
    </section>
  )
}
