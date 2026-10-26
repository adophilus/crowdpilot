import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui'
import {
  DIRECTIONS,
  draftPlanFor,
  PLANS,
  type PlanDef,
  PLATFORMS,
  type PlatformId,
  type StepState
} from '../../lib/fixtures'
import { useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_app/plans')({
  validateSearch: (search: Record<string, unknown>): { plan?: string } =>
    typeof search.plan === 'string' ? { plan: search.plan } : {},
  component: Plans
})

type When = 'now' | 'sched' | 'best'
type Ran = 'live' | 'sched'
type StepView = StepState | 'running'

const STATUS: Record<PlanDef['base'], string> = {
  ready: 'Ready to run',
  scheduled: 'Scheduled',
  drafting: 'Drafting',
  done: 'Done'
}

const STEP_LABEL: Record<StepView, string> = {
  done: 'Done',
  review: 'Needs review',
  todo: 'To do',
  sched: 'Scheduled',
  running: 'Running…'
}

function Plans() {
  const ws = useWorkspace()
  const { plan } = Route.useSearch()

  // Fixture plans plus a drafting skeleton for every direction picked with
  // Proceed that doesn't have a hand-written plan yet.
  const defs: PlanDef[] = [
    ...DIRECTIONS.filter(
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
  const [ran, setRan] = useState<Record<string, Ran>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [runStep, setRunStep] = useState(0)
  const iv = useRef<number | undefined>(undefined)
  useEffect(() => () => clearInterval(iv.current), [])

  const view = (d: PlanDef) => {
    const isRunning = running === d.id
    const r = ran[d.id]
    const steps = d.steps.map((s, i) => {
      let k: StepView = s.st
      if (r) k = r === 'sched' && i === d.steps.length - 1 ? 'sched' : 'done'
      else if (isRunning) k = i < runStep ? 'done' : i === runStep ? 'running' : s.st
      return { ...s, k }
    })
    const done = steps.filter((s) => s.k === 'done').length
    let status = STATUS[d.base]
    if (isRunning) status = 'Running'
    if (r === 'live') status = 'Live'
    if (r === 'sched') status = 'Scheduled'
    return { steps, done, status, isRunning, ran: r }
  }

  const d = defs.find((x) => x.id === sel) ?? defs[0]
  const v = view(d)
  const draft = drafts[d.id] ?? d.post
  const tg = targets[d.id] ?? { x: true, fb: true, tt: true }
  const w: When = when[d.id] ?? (d.base === 'scheduled' ? 'sched' : 'now')
  const locked =
    v.isRunning || Boolean(v.ran) || d.base === 'done' || d.base === 'scheduled'
  const tnames = PLATFORMS.filter((p) => tg[p.id]).map((p) => p.name)
  const tlist =
    tnames.length > 1
      ? `${tnames.slice(0, -1).join(', ')} and ${tnames[tnames.length - 1]}`
      : (tnames[0] ?? 'your accounts')
  const schedLabel = d.whenLabel ?? 'Thu 18:00'
  const whenText =
    w === 'now'
      ? ''
      : w === 'best'
        ? 'at the best time for your audience'
        : `for ${schedLabel}`

  const run = () => {
    clearInterval(iv.current)
    const first = d.steps.findIndex((s) => s.st !== 'done')
    let n = first < 0 ? d.steps.length : first
    setRunning(d.id)
    setRunStep(n)
    iv.current = window.setInterval(() => {
      n += 1
      if (n > d.steps.length) {
        clearInterval(iv.current)
        setRunning(null)
        setRan((r) => ({ ...r, [d.id]: w === 'now' ? 'live' : 'sched' }))
      } else {
        setRunStep(n)
      }
    }, 700)
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

          {d.base === 'drafting' && !v.ran && !v.isRunning && (
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
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="toggle-chip"
                        aria-pressed={on}
                        disabled={locked}
                        onClick={() =>
                          setTargets((t) => ({
                            ...t,
                            [d.id]: { ...tg, [p.id]: !on }
                          }))
                        }
                      >
                        {p.name}
                      </button>
                    )
                  })}
                </fieldset>
                <div role="radiogroup" aria-label="When" className="segmented segmented-sm">
                  {(
                    [
                      ['now', 'Post now'],
                      ['sched', schedLabel],
                      ['best', 'Best time']
                    ] as [When, string][]
                  ).map(([id, label]) => (
                    // biome-ignore lint/a11y/useSemanticElements: segmented radio from the design
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      className="tab"
                      aria-checked={w === id}
                      disabled={locked}
                      onClick={() => setWhen((x) => ({ ...x, [d.id]: id }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {v.ran && (
            <div role="status" className="state-live fade-in">
              <Icon name="check" size={18} stroke={2.6} />
              {v.ran === 'live'
                ? `Done. Posted to ${tlist}.`
                : `Scheduled. Posting to ${tlist} ${whenText}.`}
            </div>
          )}

          {!locked && (
            <div className="run-row">
              <button
                className="btn btn-primary btn-arrow"
                type="button"
                disabled={tnames.length === 0}
                onClick={run}
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
              Running the plan…
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
