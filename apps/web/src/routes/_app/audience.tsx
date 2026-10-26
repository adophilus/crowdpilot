import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Icon, MatchStar, PilotAvatar, Radar } from '../../components/ui'
import {
  DEMO_SEED,
  NICHES,
  PILOT_READ,
  TASTE_TABS,
  type TasteTab,
  TRAITS
} from '../../lib/fixtures'
import { levelOf, radarFrom, tasteItems } from '../../lib/taste'
import {
  lovesFrom,
  readAudience,
  relativeTime,
  useWorkspace
} from '../../lib/workspace'

export const Route = createFileRoute('/_app/audience')({
  component: Audience
})

function Audience() {
  const ws = useWorkspace()
  const [tab, setTab] = useState<TasteTab>('music')
  const [fade, setFade] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [, tick] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  // Keep "Updated N min ago" honest while the page is open.
  useEffect(() => {
    const iv = window.setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(iv)
  }, [])

  const pick = (id: TasteTab) => {
    if (id === tab || fade) return
    setFade(true)
    timer.current = window.setTimeout(() => {
      setTab(id)
      setFade(false)
    }, 180)
  }

  const refresh = async () => {
    setRefreshing(true)
    await readAudience(ws.seed ?? DEMO_SEED)
    setRefreshing(false)
  }

  const count = Object.values(ws.connected).filter(Boolean).length
  const source =
    count > 0
      ? `Built from ${count} connected account${count === 1 ? '' : 's'}`
      : ws.niche
        ? `Built from “${ws.niche}”`
        : 'Built from your answers'
  const isDemo = ws.owner === 'demo'
  const tags = lovesFrom(ws.profile, [])
  const read =
    isDemo || tags.length < 3
      ? PILOT_READ
      : `A crowd that lights up for ${tags[0].toLowerCase()}, ${tags[1].toLowerCase()} and ${tags[2].toLowerCase()}${ws.business.city ? `, with a strong ${ws.business.city} pull` : ''}.`
  const traits = isDemo || tags.length < 3 ? TRAITS : tags.slice(0, 5)
  const { items, live } = tasteItems(ws.profile, tab)

  return (
    <main className="main">
      <header className="page-head">
        <div>
          <h1 className="page-title">Your audience</h1>
          <p className="page-sub">
            {source} · {relativeTime(ws.profileUpdatedAt)}
          </p>
        </div>
        <button
          className="btn btn-outline"
          type="button"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <Icon
            name="refresh"
            size={16}
            stroke={2}
            className={refreshing ? 'spin' : undefined}
          />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {ws.profileError && !refreshing && (
        <p className="banner" role="status">
          Qloo didn't answer the last refresh. You're seeing your most recent
          profile.
        </p>
      )}

      <div className="g3 aud-top">
        <section className="card card-pad-22 fingerprint" aria-label="Taste fingerprint">
          <h2 className="card-title card-title-sm">Taste fingerprint</h2>
          <Radar values={radarFrom(ws.profile)} className="fingerprint-radar" />
        </section>

        <section className="card-ink" aria-labelledby="who-h">
          <div className="ink-head">
            <PilotAvatar size={30} inverse />
            <h2 id="who-h">Pilot's read on your crowd</h2>
          </div>
          <p className="ink-quote">{read}</p>
          <div className="ink-tags">
            {traits.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby="dom-h">
        <div className="love-head">
          <div>
            <h2 id="dom-h" className="section-title section-title-gap">
              What they love
            </h2>
            <p className="muted">
              The things your audience is most into, compared with people like
              them nearby.
            </p>
          </div>
          <div role="tablist" aria-label="Taste domain" className="segmented">
            {TASTE_TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                className="tab"
                aria-selected={tab === id}
                onClick={() => pick(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="domgrid fade" role="tabpanel" data-out={fade || undefined}>
          {items.map((it) => (
            <div key={it.name} className="dom-item">
              <div className="row-between row-baseline">
                <span className="dom-name">{it.name}</span>
                <span className="dom-level">{levelOf(it.value)}</span>
              </div>
              <div
                className="track track-8"
                role="img"
                aria-label={`${it.name}: ${levelOf(it.value)}`}
              >
                <div
                  className="track-fill bar-grow"
                  style={{
                    width: `${it.value}%`,
                    opacity: it.value >= 85 ? 1 : it.value >= 65 ? 0.75 : 0.5
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {live && ws.profile && (
          <p className="source-note">
            <span className="accent-dot" />
            Live from Qloo · grounded in {ws.profile.evidenceRefs.length} calls
          </p>
        )}
      </section>

      <section aria-labelledby="nich-h">
        <div className="section-head">
          <h2 id="nich-h" className="section-title">
            Niches hiding in your crowd
          </h2>
          <Link to="/directions" className="text-link">
            See directions
          </Link>
        </div>
        <div className="g3 aud-niches">
          {NICHES.map((n) => (
            <Link key={n.name} to="/directions" className="niche-card lift">
              <div className="row-between">
                <span className="kind-pill">{n.size}</span>
                <MatchStar fill={n.fill} />
              </div>
              <span className="niche-card-title">{n.name}</span>
              <span className="niche-card-body">{n.detail}</span>
              <span className="explore">
                Explore
                <Icon name="arrow" size={14} stroke={2.2} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
