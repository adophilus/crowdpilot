import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { DirectionActions } from '../../components/DirectionActions'
import { PilotChat } from '../../components/PilotChat'
import { MatchStar, PilotAvatar, PlatformMark, Radar } from '../../components/ui'
import {
  HOME_DIRECTIONS,
  LOVES,
  NICHES,
  PLANS,
  PLATFORMS,
  PILOT_INTRO_DEMO,
  pilotIntro
} from '../../lib/fixtures'
import { radarFrom } from '../../lib/taste'
import { lovesFrom, relativeTime, useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_app/home')({
  component: Home
})

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function Home() {
  const ws = useWorkspace()
  const [chatOpen, setChatOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 1240
  )
  const closeChat = useCallback(() => setChatOpen(false), [])
  const loves = lovesFrom(ws.profile, LOVES).slice(0, 5)
  const accounts = PLATFORMS.filter((p) => ws.connected[p.id])
  const isDemo = ws.owner === 'demo'

  const morning = PLANS.find((p) => p.id === 'morning')
  const plans = [
    ...HOME_DIRECTIONS.filter((d) => ws.picks[d.id] === 'taken').map((d) => ({
      id: d.id,
      title: d.title,
      next: 'Pilot is drafting the steps…',
      done: 0,
      total: 4,
      status: 'Drafting'
    })),
    ...(morning
      ? [
          {
            id: morning.id,
            title: morning.title,
            next: 'Next: announcement post · Mon 09:00',
            done: 3,
            total: 4,
            status: 'Scheduled'
          }
        ]
      : [])
  ]

  const context = [
    `Context (already on file): I run ${ws.business.name}${ws.business.city ? ` in ${ws.business.city}` : ''}.`,
    ws.niche ? `The crowd I care about: ${ws.niche}.` : '',
    `My audience loves ${loves.join(', ')}.`
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <main className="main">
        <header className="page-head">
          <div>
            <h1 className="page-title">
              {greeting()}, {ws.business.first}
            </h1>
            <p className="page-sub">
              Here's what your audience is into, and what to do about it.
            </p>
          </div>
          <button
            className="btn btn-outline btn-pilot"
            type="button"
            aria-pressed={chatOpen}
            onClick={() => setChatOpen((v) => !v)}
          >
            <PilotAvatar size={28} />
            {chatOpen ? 'Hide Pilot' : 'Ask Pilot'}
          </button>
        </header>

        <div className="g3 top3">
          <section className="card snap" aria-labelledby="snap-h">
            <div className="snap-radar">
              <Radar values={radarFrom(ws.profile)} />
            </div>
            <div className="snap-body">
              <div className="row-between">
                <h2 id="snap-h" className="card-title">
                  Your audience
                </h2>
                <Link to="/audience" className="text-link">
                  Full profile
                </Link>
              </div>
              <div>
                <div className="micro-label">They love</div>
                <div className="tag-row">
                  {loves.map((l) => (
                    <span key={l} className="tag">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="snap-foot">
                <div className="acct-glyphs">
                  {accounts.map((a) => (
                    <span
                      key={a.id}
                      role="img"
                      aria-label={`${a.name} connected`}
                      title={a.name}
                      className="acct-glyph"
                    >
                      <PlatformMark platform={a.id} size={16} />
                      <i />
                    </span>
                  ))}
                  {accounts.length === 0 && (
                    <Link to="/accounts" className="text-link text-sm">
                      Connect an account
                    </Link>
                  )}
                </div>
                <span className="muted-sm">
                  {ws.profile && ws.profile.evidenceRefs.length > 0 && (
                    <span className="qloo-tag">
                      {ws.profile.evidenceRefs.length} Qloo calls
                    </span>
                  )}
                  {relativeTime(ws.profileUpdatedAt)}
                </span>
              </div>
            </div>
          </section>

          <section className="card card-stack" aria-labelledby="niche-h">
            <h2 id="niche-h" className="card-title">
              Niches in your crowd
            </h2>
            {NICHES.map((n) => (
              <div key={n.name} className="niche-row">
                <MatchStar fill={n.fill} />
                <span className="niche-text">
                  <span className="niche-name">{n.name}</span>
                  <span className="niche-note">{n.note}</span>
                </span>
              </div>
            ))}
          </section>
        </div>

        <section aria-labelledby="dir-h">
          <div className="section-head">
            <h2 id="dir-h" className="section-title">
              Suggested directions
            </h2>
            <Link to="/directions" className="text-link">
              See all directions
            </Link>
          </div>
          <div className="g3 dirs">
            {HOME_DIRECTIONS.map((d) => {
              const s = ws.picks[d.id]
              return (
                <article
                  key={d.id}
                  className="card-dir dir"
                  data-state={s ?? (d.fill === 100 ? 'best' : undefined)}
                >
                  <div className="row-between">
                    <span className="kind-pill">{d.kind}</span>
                    <MatchStar fill={d.fill} />
                  </div>
                  <h3 className="dir-title">{d.title}</h3>
                  <p className="dir-body">{d.why}</p>
                  <div className="dir-actions">
                    <DirectionActions id={d.id} takenLabel="Added to your plans" />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="card" aria-labelledby="plan-h">
          <div className="section-head section-head-tight">
            <h2 id="plan-h" className="section-title">
              Your plans
            </h2>
            <Link to="/plans" className="text-link">
              See all
            </Link>
          </div>
          <div>
            {plans.map((p) => (
              <div key={p.id} className="plan-line msg">
                <div className="plan-line-text">
                  <div className="plan-line-title">{p.title}</div>
                  <div className="plan-line-next">{p.next}</div>
                </div>
                <div className="plan-line-prog">
                  <div className="track">
                    <div
                      className="track-fill"
                      style={{ width: `${Math.round((p.done / p.total) * 100)}%` }}
                    />
                  </div>
                  <span className="mono-count">
                    {p.done}/{p.total}
                  </span>
                </div>
                <span className="status-chip" data-status={p.status}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {chatOpen && ws.owner && (
        <PilotChat
          owner={ws.owner}
          intro={isDemo ? PILOT_INTRO_DEMO : pilotIntro(ws.business.first)}
          context={context}
          onClose={closeChat}
        />
      )}
    </>
  )
}
