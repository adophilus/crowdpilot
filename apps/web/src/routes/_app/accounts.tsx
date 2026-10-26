import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui'
import { PLATFORMS, type PlatformId } from '../../lib/fixtures'
import { updateWorkspace, useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_app/accounts')({
  component: Accounts
})

// Connect / sync are simulated until Onscript account linking is exposed to
// the web app; the state persists in the local workspace.
function Accounts() {
  const ws = useWorkspace()
  const [syncing, setSyncing] = useState<PlatformId | null>(null)
  const [connecting, setConnecting] = useState<PlatformId | null>(null)
  const [draft, setDraft] = useState('')
  const timers = useRef<number[]>([])
  useEffect(() => {
    const list = timers.current
    return () => {
      for (const t of list) clearTimeout(t)
    }
  }, [])
  const later = (fn: () => void, ms: number) =>
    timers.current.push(window.setTimeout(fn, ms))

  const handle = `@${ws.business.name
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'yourbusiness'}`

  const add = () => {
    const v = draft.trim()
    if (!v || ws.tracked.includes(v)) return
    updateWorkspace((w) => ({ tracked: [...w.tracked, v] }))
    setDraft('')
  }

  return (
    <main className="main main-narrow">
      <header>
        <h1 className="page-title">Accounts</h1>
        <p className="page-sub">
          Where CrowdPilot reads your audience, and where it posts when you say
          so.
        </p>
      </header>

      <section className="card card-stack card-gap-12" aria-labelledby="con-h">
        <h2 id="con-h" className="card-title card-title-gap">
          Social accounts
        </h2>
        {PLATFORMS.map((p) => {
          const on = Boolean(ws.connected[p.id])
          const isSync = syncing === p.id
          const isConn = connecting === p.id
          return (
            <div key={p.id} className="acct-row" data-on={on || undefined}>
              <span className="platform-glyph platform-glyph-lg" aria-hidden="true">
                <span />
              </span>
              <span className="acct-row-text">
                <span className="acct-row-name">
                  <span>{p.name}</span>
                  {on && <span className="acct-row-handle">{handle}</span>}
                </span>
                <span className="acct-row-sub">
                  {on
                    ? isSync
                      ? 'Syncing followers and engagement…'
                      : `Reads followers & engagement · Posts with your approval · Synced ${ws.synced[p.id]}`
                    : 'Not connected'}
                </span>
              </span>
              <span className="conn-chip" data-on={on || undefined}>
                {on ? 'Connected' : 'Off'}
              </span>
              <span className="acct-row-actions">
                {on ? (
                  <>
                    <button
                      className="btn btn-outline btn-row"
                      type="button"
                      disabled={isSync}
                      onClick={() => {
                        setSyncing(p.id)
                        later(() => {
                          setSyncing(null)
                          updateWorkspace((w) => ({
                            synced: { ...w.synced, [p.id]: 'just now' }
                          }))
                        }, 1300)
                      }}
                    >
                      {isSync ? 'Syncing…' : 'Sync now'}
                    </button>
                    <button
                      className="btn btn-outline btn-row btn-row-quiet"
                      type="button"
                      aria-label={`Disconnect ${p.name}`}
                      onClick={() =>
                        updateWorkspace((w) => ({
                          connected: { ...w.connected, [p.id]: false }
                        }))
                      }
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-row btn-row-wide"
                    type="button"
                    disabled={isConn}
                    onClick={() => {
                      setConnecting(p.id)
                      later(() => {
                        setConnecting(null)
                        updateWorkspace((w) => ({
                          connected: { ...w.connected, [p.id]: true },
                          synced: { ...w.synced, [p.id]: 'just now' }
                        }))
                      }, 1100)
                    }}
                  >
                    {isConn ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </span>
            </div>
          )
        })}
        <div className="platform-more platform-more-lg">
          <span aria-hidden="true">
            <Icon name="plus" size={18} stroke={2} />
          </span>
          More platforms coming soon
        </div>
      </section>

      <section className="card card-stack" aria-labelledby="tn-h">
        <div>
          <h2 id="tn-h" className="card-title card-title-gap">
            Niches you're tracking
          </h2>
          <p className="muted">
            Crowds you want to break into. Pilot watches their taste and
            suggests ways in.
          </p>
        </div>
        {ws.tracked.length > 0 && (
          <div className="chip-line chip-line-8">
            {ws.tracked.map((label) => (
              <span key={label} className="tracked pop">
                {label}
                <button
                  type="button"
                  aria-label={`Stop tracking ${label}`}
                  onClick={() =>
                    updateWorkspace((w) => ({
                      tracked: w.tracked.filter((x) => x !== label)
                    }))
                  }
                >
                  <Icon name="close" size={12} stroke={2.6} />
                </button>
              </span>
            ))}
          </div>
        )}
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <label htmlFor="cp-track" className="sr-only">
            Describe a niche to track
          </label>
          <input
            id="cp-track"
            className="field field-sm"
            type="text"
            placeholder="e.g. Afro-house fans in Accra"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary btn-form" type="submit" disabled={!draft.trim()}>
            Track niche
          </button>
        </form>
      </section>

      <div className="trust-note">
        <Icon name="shield" size={18} stroke={1.9} />
        <span>
          CrowdPilot only reads audience signals like follows and engagement.
          Nothing is posted without your approval.{' '}
          <Link to="/settings">Manage approvals</Link>
        </span>
      </div>
    </main>
  )
}
