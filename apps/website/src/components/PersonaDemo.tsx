import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { LogoMark } from './Logo'

type Persona = {
  id: string
  tab: string
  name: string
  place: string
  seeds: string[]
  question: string
  picks: { label: string; score: string }[]
  receipts: string[]
  post: string
  when: string
}

// Illustrative content only — the live app pulls picks/scores from Qloo.
const PERSONAS: Persona[] = [
  {
    id: 'creator',
    tab: 'Break into a niche',
    name: 'Wanjiru Eats',
    place: 'Nairobi · food creator going plant-based',
    seeds: ['Street food', 'Swahili cuisine', 'Travel vlogs'],
    question: 'How do I win over the plant-based crowd in Nairobi?',
    picks: [
      { label: 'Vegan takes on street classics', score: '0.90' },
      { label: 'Farmers-market tours', score: '0.85' },
      { label: 'Run-club & wellness creators', score: '0.78' }
    ],
    receipts: [
      'Plant-based audience over-indexes on street-food content',
      'Strong overlap with farmers markets and organic grocers',
      'Run clubs share fans with this niche: good collab targets'
    ],
    post: 'Plant-based street food, round one: vegan mandazi and a chapati wrap. Recipe drops Thursday.',
    when: 'Thu 12:00'
  },
  {
    id: 'cafe',
    tab: 'Go deeper',
    name: "Kofi's Café",
    place: 'Lagos · specialty coffee bar',
    seeds: ['Afrobeats', 'Highlife', 'Pour-over coffee', 'Jollof'],
    question: 'What will make our regulars feel seen this weekend?',
    picks: [
      { label: 'Alté & soft Afrobeats', score: '0.94' },
      { label: 'Highlife classics', score: '0.88' },
      { label: 'Neo-soul', score: '0.81' }
    ],
    receipts: [
      'Crowd over-indexes on alté artists vs. Lagos baseline',
      'Shared fans between highlife and specialty-coffee venues',
      'Neo-soul overlaps with the brunch places this crowd likes'
    ],
    post: 'Brunch just got a soundtrack. Soft Afrobeats from 10am, pour-overs all day. Come through.',
    when: 'Sat 10:00'
  },
  {
    id: 'event',
    tab: 'Find new niches',
    name: 'Harbour Nights',
    place: 'Accra · monthly night market',
    seeds: ['Amapiano', 'Streetwear', 'Street food'],
    question: 'What other scenes overlap with our crowd?',
    picks: [
      { label: 'Afro-house nights', score: '0.91' },
      { label: 'Vintage & thrift pop-ups', score: '0.86' },
      { label: 'Spoken-word & poetry', score: '0.79' }
    ],
    receipts: [
      'Amapiano fans here over-index on Afro-house',
      'Strong crossover between streetwear and thrift culture',
      'A smaller, growing overlap with spoken-word events'
    ],
    post: 'New at Harbour Nights: an Afro-house corner from 10pm, plus a thrift pop-up. Bring the crew.',
    when: 'Fri 18:00'
  }
]

export function PersonaDemo() {
  const [current, setCurrent] = useState('creator')
  const [pending, setPending] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const cur = PERSONAS.find((p) => p.id === current) ?? PERSONAS[0]
  const selected = pending ?? current
  const fading = pending !== null

  const pick = (id: string) => {
    if (id === current || fading) return
    setPending(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setCurrent(id)
      setPosted(false)
      setPending(null)
    }, 200)
  }

  const onTabKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const n = PERSONAS.length
    const next = PERSONAS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]
    pick(next.id)
    document.getElementById(`persona-tab-${next.id}`)?.focus()
  }

  const swap = `swap${fading ? ' is-fading' : ''}`

  return (
    <section id="demo" className="demo" aria-labelledby="demo-h">
      <div className="demo__box">
        <div className="demo__head">
          <div>
            <div className="demo__eyebrow">
              Three goals, one engine. Pick one.
            </div>
            <h2 id="demo-h" className="demo__title">
              Ask about your audience. Act on the answer.
            </h2>
          </div>
          <div
            className="persona-tabs"
            role="tablist"
            aria-label="Choose a goal"
          >
            {PERSONAS.map((p, i) => (
              <button
                key={p.id}
                id={`persona-tab-${p.id}`}
                className="persona-tab"
                type="button"
                role="tab"
                aria-selected={p.id === selected}
                aria-controls="persona-panel"
                tabIndex={p.id === selected ? 0 : -1}
                onClick={() => pick(p.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {p.tab}
              </button>
            ))}
          </div>
        </div>

        <div
          className="appwin"
          id="persona-panel"
          role="tabpanel"
          aria-labelledby={`persona-tab-${current}`}
        >
          <aside className={`appside ${swap}`}>
            <div className="appside__brand">
              <LogoMark size={22} ink="var(--ink)" />
              CrowdPilot
            </div>
            <div className="label-caps">Crowd</div>
            <div className="appside__crowd">
              <div style={{ fontWeight: 600, fontSize: 14 }}>{cur.name}</div>
              <div className="small-muted" style={{ marginTop: 3 }}>
                {cur.place}
              </div>
            </div>
            <div className="label-caps">Seed tastes</div>
            <div className="chips">
              {cur.seeds.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </aside>

          <div className={`appmain ${swap}`}>
            <div className="bubble">{cur.question}</div>

            <div className="split">
              <div className="panel panel--picks">
                <div className="panel__head">
                  <div>Grounded picks</div>
                  <div className="small-muted" style={{ fontWeight: 400 }}>
                    affinity score
                  </div>
                </div>
                <div className="picks">
                  {cur.picks.map((k, i) => (
                    // index keys keep the bar element so its width animates
                    <div key={i}>
                      <div className="pick__row">
                        <span>{k.label}</span>
                        <span className="pick__score">{k.score}</span>
                      </div>
                      <div className="pick__track">
                        <div
                          className="pick__fill"
                          style={{
                            width: `${Math.round(Number.parseFloat(k.score) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel panel--evidence">
                <div className="panel__head panel__head--icon">
                  <Icon name="doc" size={16} strokeWidth={2} />
                  Evidence trail
                </div>
                <div className="receipts">
                  {cur.receipts.map((r) => (
                    <div key={r} className="receipt">
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="draft">
              <div className="draft__text">
                <div className="small-muted" style={{ marginBottom: 6 }}>
                  Drafted in your voice
                </div>
                <div className="draft__post">{cur.post}</div>
              </div>
              {posted ? (
                <div className="shipped" role="status">
                  <Icon name="check" size={16} strokeWidth={2.4} />
                  Scheduled · {cur.when}
                </div>
              ) : (
                <button
                  type="button"
                  className="ship-btn"
                  onClick={() => setPosted(true)}
                >
                  Make it happen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="disclaimer">
        Illustrative example. Live picks and scores come from Qloo's API at run
        time.
      </p>
    </section>
  )
}
