import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { DirectionActions } from '../../components/DirectionActions'
import { Icon, MatchStar, PilotAvatar } from '../../components/ui'
import {
  DIRECTION_FILTERS,
  DIRECTIONS,
  type GoalId,
  matchLabel
} from '../../lib/fixtures'
import { useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_app/directions')({
  component: Directions
})

function Directions() {
  const ws = useWorkspace()
  const [filter, setFilter] = useState<'all' | GoalId>('all')
  const [why, setWhy] = useState<Record<string, boolean>>({ brunch: true })
  const cards = DIRECTIONS.filter((d) => filter === 'all' || d.goal === filter)

  return (
    <main className="main">
      <header className="page-head">
        <div>
          <h1 className="page-title">Directions</h1>
          <p className="page-sub">
            Where Pilot thinks you should take your audience next, best matches
            first.
          </p>
        </div>
        <Link to="/home" className="btn btn-outline btn-pilot">
          <PilotAvatar size={28} />
          Ask Pilot for more
        </Link>
      </header>

      <div role="tablist" aria-label="Filter by goal" className="filter-row">
        {DIRECTION_FILTERS.map(([id, label]) => {
          const count =
            id === 'all'
              ? DIRECTIONS.length
              : DIRECTIONS.filter((d) => d.goal === id).length
          return (
            <button
              key={id}
              type="button"
              role="tab"
              className="filter tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
              <span className="filter-count">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="g3 dir-grid">
        {cards.map((d) => {
          const s = ws.picks[d.id]
          const open = Boolean(why[d.id])
          return (
            <article
              key={d.id}
              className="card-dir card-hover"
              data-state={s ?? (d.fill === 100 ? 'best' : undefined)}
            >
              <div className="row-between">
                <span className="kind-pill">{d.kind}</span>
                <span className="match">
                  {matchLabel(d.fill)}
                  <MatchStar fill={d.fill} />
                </span>
              </div>
              <h2 className="dir-title">{d.title}</h2>
              <p className="dir-body">{d.summary}</p>
              <button
                type="button"
                className="why-toggle"
                aria-expanded={open}
                onClick={() => setWhy((w) => ({ ...w, [d.id]: !open }))}
              >
                {open ? 'Hide why' : 'Why this?'}
                <Icon
                  name="chevDown"
                  size={14}
                  stroke={2.2}
                  style={{
                    transition: 'transform .2s ease',
                    transform: `rotate(${open ? 180 : 0}deg)`
                  }}
                />
              </button>
              {open && (
                <ul className="why">
                  {d.receipts.map((r) => (
                    <li key={r}>
                      <span className="accent-dot accent-dot-sm" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              <div className="dir-actions dir-actions-tight">
                <DirectionActions id={d.id} takenLabel="Added to plans" viewPlan />
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
