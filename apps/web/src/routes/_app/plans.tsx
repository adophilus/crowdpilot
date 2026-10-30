import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api, bearer } from '../../lib/api'
import { Icon } from '../../components/ui'
import {
  API_PLATFORM,
  DIRECTIONS,
  draftPlanFor,
  PLANS,
  type ApiPlatform,
  type PlanDef,
  PLATFORMS,
  platformShort,
  type PlatformId,
  type StepState
} from '../../lib/fixtures'
import { useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_app/plans')({
  validateSearch: (search: Record<string, unknown>): { plan?: string } =>
    typeof search.plan === 'string' ? { plan: search.plan } : {},
  component: Plans
})

type When = 'now' | 'sched'
type Ship =
  | { phase: 'publishing'; note: string }
  | { phase: 'scheduled'; note: string }
  | { phase: 'done'; links: { label: string; url: string }[]; note: string }
  | { phase: 'failed'; reason: string }
const STATUS: Record<PlanDef['base'], string> = {
  ready: 'Ready to run',
  scheduled: 'Scheduled',
  drafting: 'Drafting',
  done: 'Done'
}

const STEP_LABEL: Record<StepState, string> = {
  done: 'Done',
  review: 'Needs review',
  todo: 'To do',
  sched: 'Scheduled'
}

// Onscript PostStatus → the chip vocabulary this screen already uses.
const TERMINAL = ['PUBLISHED', 'PARTIALLY_PUBLISHED', 'FAILED']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function Plans() {
  const ws = useWorkspace()
  const { plan } = Route.useSearch()

  // Generated directions win when present; fixture plans remain the fallback.
  // A drafting skeleton is added for every direction picked with Proceed that
  // doesn't have a hand-written plan yet.
  const directionSource = ws.directions.length ? ws.directions : DIRECTIONS
  const defs: PlanDef[] = [
    ...directionSource.filter(
      (d) => ws.picks[d.id] === 'taken' && !PLANS.some((p) => p.id === d.id)
    ).map(draftPlanFor),
    ...PLANS
  ]

  const [sel, setSel] = useState(
    plan && defs.some((d) => d.id === plan) ? plan : 'brunch'
  )
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [targets, setTargets] = useState<
    Record<string, Record<PlatformId, boolean>>
  >({})
  const [when, setWhen] = useState<Record<string, When>>({})
  const [ships, setShips] = useState<Record<string, Ship>>({})
  const [shipError, setShipError] = useState('')

  // Real connected accounts (from Onscript) gate the platform toggles.
  const [connected, setConnected] = useState<PlatformId[]>([])
  // Shipped posts, refreshed on mount and after every ship.

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.GET('/onscript/accounts', bearer())
        const ids = data
          ? PLATFORMS.filter(
              (p) =>
                !p.soon &&
                data.accounts.some(
                  (a) => a.platform === API_PLATFORM[p.id] && a.isActive
                )
            ).map((p) => p.id)
          : []
        setConnected(ids)
        // Snap untouched plans to what's actually publishable.
        setTargets((t) => {
          const next = { ...t }
          for (const d of defs)
            if (!next[d.id])
              next[d.id] = {
                x: ids.includes('x'),
                fb: ids.includes('fb'),
                ig: false
              }
          return next
        })
      } catch {
        setConnected([])
      }
    })()
  }, [])

  const view = (d: PlanDef) => {
    const ship = ships[d.id]
    const isRunning = ship?.phase === 'publishing'
    const steps = d.steps.map((s) => ({ ...s, k: s.st }))
    const done = steps.filter((s) => s.k === 'done').length
    let status = STATUS[d.base]
    if (isRunning) status = 'Running'
    if (ship?.phase === 'done') status = 'Live'
    if (ship?.phase === 'scheduled') status = 'Scheduled'
    return { steps, done, status, isRunning, ship }
  }

  const d = defs.find((x) => x.id === sel) ?? defs[0]
  const ship = ships[d.id]
  const v = view(d)
  const draft = drafts[d.id] ?? d.post
  const tg =
    targets[d.id] ?? { x: connected.includes('x'), fb: connected.includes('fb'), ig: false }
  const w: When = when[d.id] ?? 'now'
  const isConnected = (p: (typeof PLATFORMS)[number]): boolean =>
    connected.includes(p.id)
  const avail = PLATFORMS.filter((p) => !p.soon && isConnected(p))
  const chosen = avail.filter((p) => tg[p.id])
  const locked =
    v.isRunning ||
    ship?.phase === 'done' ||
    ship?.phase === 'scheduled' ||
    d.base === 'done' ||
    d.base === 'scheduled'
  const tnames = chosen.map((p) => p.short)
  const tlist =
    tnames.length > 1
      ? `${tnames.slice(0, -1).join(', ')} and ${tnames[tnames.length - 1]}`
      : (tnames[0] ?? 'your accounts')

  // Poll GET /posts/:id until Onscript reports a terminal status.
  const pollPost = async (
    id: string
  ): Promise<{
    status: string
    permalink?: string
    perPlatform: { platform: ApiPlatform; status: string; url?: string; failureReason?: string }[]
  } | null> => {
    const deadline = Date.now() + 90_000
    while (Date.now() < deadline) {
      await sleep(2000)
      try {
        const { data } = await api.GET('/posts/{id}', {
          ...bearer(),
          params: { path: { id } }
        })
        if (data && TERMINAL.includes(data.status)) return data
      } catch {
        /* transient — keep polling */
      }
    }
    return null
  }

  const run = async () => {
    if (chosen.length === 0 || !draft.trim()) return
    setShipError('')
    const platforms = chosen.map((p) => API_PLATFORM[p.id])
    if (w === 'now') {
      setShips((s) => ({
        ...s,
        [d.id]: { phase: 'publishing', note: `Publishing to ${tlist}…` }
      }))
      try {
        const { data, error } = await api.POST('/posts', {
          ...bearer(),
          body: { text: draft, platforms, publishNow: true }
        })
        if (error || !data) {
          setShips((s) => ({ ...s, [d.id]: { phase: 'failed', reason: error && 'message' in error && error.message ? error.message : "Couldn't create the post. Try again." } }))
          return
        }
        const detail = await pollPost(data.id)
        if (!detail) {
          setShips((s) => ({
            ...s,
            [d.id]: {
              phase: 'failed',
              reason: 'Still publishing on Onscript. Check Shipped below in a moment.'
            }
          }))
        } else if (detail.status === 'FAILED') {
          const why = detail.perPlatform.find((x) => x.failureReason)
          setShips((s) => ({
            ...s,
            [d.id]: { phase: 'failed', reason: why?.failureReason ?? 'Onscript reported a failure.' }
          }))
        } else {
          const links = detail.perPlatform
            .filter((x) => x.url)
            .map((x) => ({ label: platformShort(x.platform), url: x.url as string }))
          const failedOn = detail.perPlatform.filter(
            (x) => x.status === 'FAILED' || x.failureReason
          )
          setShips((s) => ({
            ...s,
            [d.id]: {
              phase: 'done',
              links,
              note: failedOn
                .map((x) => `${platformShort(x.platform)} failed${x.failureReason ? `: ${x.failureReason}` : ''}`)
                .join(' · ')
            }
          }))
        }
      } catch {
        setShips((s) => ({
          ...s,
          [d.id]: { phase: 'failed', reason: 'Connection lost while publishing. Try again.' }
        }))
      } finally {
        }
    }
  }

  return (
    <main className="main">
      <header className="page-head">
        <div>
          <h1 className="page-title">Plans</h1>
          <p className="page-sub">
            Directions you've picked, turned into steps. Review, then run or
            schedule.
          </p>
        </div>
        <Link to="/directions" className="btn btn-outline">
          <Icon name="plus" size={16} stroke={2} />
          New plan from a direction
        </Link>
      </header>

      <div className="plans-wrap">
        <section className="planlist" aria-label="All plans">
          {defs.map((p) => {
            const pv = view(p)
            const on = p.id === d.id
            return (
              <button
                key={p.id}
                type="button"
                className="plan-row"
                aria-pressed={on}
                onClick={() => setSel(p.id)}
              >
                <span className="row-between">
                  <span className="plan-kind">{p.kind}</span>
                  <span className="status-chip" data-status={pv.status}>
                    {pv.status}
                  </span>
                </span>
                <span className="plan-row-title">{p.title}</span>
                <span className="plan-row-prog">
                  <span className="track">
                    <span
                      className="track-fill"
                      style={{
                        width: `${Math.round((pv.done / p.steps.length) * 100)}%`
                      }}
                    />
                  </span>
                  <span className="mono-count mono-sm">
                    {pv.done}/{p.steps.length}
                  </span>
                </span>
              </button>
            )
          })}
        </section>

        <section key={d.id} className="plan-detail fade-in" aria-label="Plan detail">
          <div className="plan-detail-head">
            <div className="min0">
              <div className="chip-line">
                <span className="kind-pill">{d.kind}</span>
                <span className="status-chip" data-status={v.status}>
                  {v.status}
                </span>
              </div>
              <h2 className="plan-title">{d.title}</h2>
              <p className="plan-why">{d.why}</p>
            </div>
            <Link to="/home" className="btn-ghost-sm">
              Ask Pilot to change this
            </Link>
          </div>

          {d.base === 'drafting' && !v.ship && !v.isRunning && (
            <div role="status" className="note-row">
              <span className="accent-dot accent-dot-lg" />
              Pilot is still drafting this plan. You can review what's ready so
              far.
            </div>
          )}

          <div>
            <h3 className="sub-title">Steps</h3>
            <ol className="steps">
              {v.steps.map((s) => (
                <li key={s.title} className="step" data-k={s.k}>
                  <span className="step-dot">
                    {s.k === 'done' && <Icon name="check" size={12} stroke={3.2} />}
                    {s.k === 'sched' && <Icon name="clock" size={13} stroke={2.4} />}
                  </span>
                  <span className="step-text">
                    <span className="step-title">{s.title}</span>
                    <span className="step-detail">{s.detail}</span>
                  </span>
                  <span className="step-tag">{STEP_LABEL[s.k]}</span>
                </li>
              ))}
            </ol>
          </div>

          {d.post && (
            <div className="post-box">
              <div className="row-between row-wrap">
                <label htmlFor="cp-post" className="sub-title sub-title-flat">
                  The post, in your voice
                </label>
                <span className="muted-xs">{draft.length} characters</span>
              </div>
              <textarea
                id="cp-post"
                className="field field-area"
                rows={3}
                value={draft}
                disabled={locked}
                onChange={(e) =>
                  setDrafts((x) => ({ ...x, [d.id]: e.target.value }))
                }
              />
              <div className="row-between row-wrap">
                <fieldset className="chip-line fieldset">
                  <legend className="sr-only">Post to</legend>
                  {PLATFORMS.map((p) => {
                    const on = Boolean(tg[p.id])
                    const ok = isConnected(p)
                    const hint = p.soon
                      ? 'Coming soon'
                      : ok
                        ? undefined
                        : 'No connected account. Connect it on the Accounts page'
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="toggle-chip"
                        aria-pressed={on && ok}
                        title={hint}
                        disabled={locked || !ok}
                        onClick={() =>
                          setTargets((t) => ({
                            ...t,
                            [d.id]: { ...tg, [p.id]: !on }
                          }))
                        }
                      >
                        {p.short}
                        {!ok && <span className="muted-xs">{p.soon ? ' · coming soon' : ' · not connected'}</span>}
                      </button>
                    )
                  })}
                  {avail.length === 0 && (
                    <Link to="/accounts" className="text-link text-sm">
                      Connect accounts to publish
                    </Link>
                  )}
                </fieldset>
                <div role="radiogroup" aria-label="When" className="segmented segmented-sm">
                  {/* Scheduling works end to end but stays hidden pending a product call. */}
                  {/* biome-ignore lint/a11y/useSemanticElements: segmented radio from the design */}
                  <button
                    key="now"
                    type="button"
                    role="radio"
                    className="tab"
                    aria-checked={w === 'now'}
                    disabled={locked}
                    onClick={() => setWhen((x) => ({ ...x, [d.id]: 'now' }))}
                  >
                    Post now
                  </button>
                  {/* biome-ignore lint/a11y/useSemanticElements: segmented radio from the design */}
                  <button
                    key="sched"
                    type="button"
                    role="radio"
                    className="tab"
                    aria-checked={false}
                    disabled
                    title="Scheduling is coming soon"
                  >
                    Schedule · soon
                  </button>
                </div>
              </div>
            </div>
          )}

          {ship?.phase === 'done' && (
            <div role="status" className="state-live fade-in">
              <Icon name="check" size={18} stroke={2.6} />
              <span>
                Posted{tnames.length > 0 ? ` to ${tlist}` : ''}.{' '}
                {ship.links.map((l, i) => (
                  <span key={l.url}>
                    {i > 0 && ' · '}
                    <a className="text-link" href={l.url} target="_blank" rel="noreferrer">
                      View on {l.label}
                    </a>
                  </span>
                ))}
                {ship.note && <span className="muted-sm"> {ship.note}</span>}
              </span>
            </div>
          )}
          {ship?.phase === 'scheduled' && (
            <div role="status" className="state-live fade-in">
              <Icon name="clock" size={18} stroke={2.4} />
              {ship.note}
            </div>
          )}
          {ship?.phase === 'failed' && (
            <div role="alert" className="card-danger card card-stack fade-in">
              <strong>Didn't ship.</strong> {ship.reason}
            </div>
          )}
          {shipError && (
            <p className="form-error" role="alert">
              {shipError}
            </p>
          )}

          {!locked && (
            <div className="run-row">
              <button
                className="btn btn-primary btn-arrow"
                type="button"
                disabled={chosen.length === 0}
                onClick={() => void run()}
              >
                {w === 'now' ? 'Run it now' : 'Schedule it'}
                <span className="btn-arrow-dot is-accent" aria-hidden="true">
                  <Icon name="arrow" size={14} stroke={2.2} />
                </span>
              </button>
              <span className="muted-sm">Nothing goes out until you press this.</span>
            </div>
          )}
          {v.isRunning && (
            <div role="status" className="running-row">
              <span className="accent-dot accent-dot-lg pulse" />
              {ship?.phase === 'publishing' ? ship.note : ''}
            </div>
          )}
        </section>
      </div>

    </main>
  )
}
