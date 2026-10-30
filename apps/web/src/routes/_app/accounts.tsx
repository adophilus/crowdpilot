import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api, bearer } from '../../lib/api'
import {
  API_PLATFORM,
  PLATFORMS,
  type PlatformId
} from '../../lib/fixtures'
import { updateWorkspace, useWorkspace } from '../../lib/workspace'
import { Icon, PlatformMark } from '../../components/ui'

export const Route = createFileRoute('/_app/accounts')({
  component: Accounts
})

type OnscriptAccount = {
  id: string
  platform: 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'
  username?: string
  displayName?: string
  isActive: boolean
}

function Accounts() {
  const ws = useWorkspace()

  const [accounts, setAccounts] = useState<OnscriptAccount[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [connecting, setConnecting] = useState<PlatformId | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [connectError, setConnectError] = useState('')

  const connectedFor = (id: PlatformId): OnscriptAccount | undefined =>
    accounts?.find((a) => a.platform === API_PLATFORM[id] && a.isActive)

  // Real account state → mirrors into the workspace so the dashboard
  // (home glyphs, plan guards) shows the truth without its own fetch.
  const mirror = (list: OnscriptAccount[]) =>
    updateWorkspace(() => ({
      connected: {
        x: list.some((a) => a.platform === 'TWITTER' && a.isActive),
        fb: list.some((a) => a.platform === 'FACEBOOK' && a.isActive),
        ig: list.some((a) => a.platform === 'INSTAGRAM' && a.isActive)
      }
    }))

  const loadAccounts = async (): Promise<OnscriptAccount[] | null> => {
    try {
      const { data, error } = await api.GET('/onscript/accounts', bearer())
      if (error || !data) {
        setLoadError(true)
        return null
      }
      setAccounts(data.accounts)
      setLoadError(false)
      mirror(data.accounts)
      return data.accounts
    } catch {
      setLoadError(true)
      return null
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [])

  // Connect: Onscript-hosted OAuth in a popup. While it's open, poll the
  // mapped list AND claim whatever new account lands (Onscript attaches the
  // connection to the shared service account; claim records that it's ours).
  const connect = async (p: (typeof PLATFORMS)[number]) => {
    setConnecting(p.id)
    setConnectError('')
    try {
      const { data, error } = await api.POST('/onscript/connect/url', {
        ...bearer(),
        body: { platform: API_PLATFORM[p.id] }
      })
      if (error || !data) {
        setConnectError(
          error && 'message' in error && error.message
            ? error.message
            : `Couldn't start connecting ${p.short}. Try again.`
        )
        return
      }
      window.open(data.authUrl, 'crowdpilot-connect', 'width=520,height=720')
      const deadline = Date.now() + 90_000
      let ticks = 0
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000))
        ticks += 1
        if (ticks % 2 === 0) {
          const { data: claim } = await api.POST('/onscript/connect/claim', {
            ...bearer()
          })
          if (claim?.claimed) {
            await loadAccounts()
            return
          }
        }
        const list = await loadAccounts()
        if (list?.some((a) => a.platform === API_PLATFORM[p.id] && a.isActive))
          return
      }
      setConnectError(
        `Still waiting on ${p.short}. Finish the popup, then hit Sync.`
      )
    } catch {
      setConnectError(`Couldn't start connecting ${p.short}. Try again.`)
    } finally {
      setConnecting(null)
    }
  }

  const disconnect = async (acct: OnscriptAccount) => {
    setDisconnecting(acct.id)
    try {
      await api.POST('/onscript/disconnect', {
        ...bearer(),
        body: { accountId: acct.id }
      })
    } catch {
      /* refresh below shows the real state either way */
    }
    await loadAccounts()
    setDisconnecting(null)
  }

  // One real sync: re-read accounts, stamp the rows we refreshed.
  const syncAll = async () => {
    setSyncing(true)
    const list = await loadAccounts()
    if (list) {
      const now = 'just now'
      updateWorkspace(() => ({ synced: { x: now, fb: now, ig: now } }))
    }
    setSyncing(false)
  }

  const [draft, setDraft] = useState('')

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
        <div className="row-between row-wrap">
          <h2 id="con-h" className="card-title card-title-gap">
            Social accounts
          </h2>
          <button
            type="button"
            className="btn btn-outline btn-row"
            disabled={syncing || accounts === null}
            onClick={() => void syncAll()}
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        {loadError && accounts === null && (
          <div role="status" className="note-row">
            <span className="accent-dot accent-dot-lg" />
            Couldn't reach the posting service. Your accounts here are shown
            from the last known state.
          </div>
        )}
        {PLATFORMS.map((p) => {
          const acct = connectedFor(p.id)
          const on = Boolean(acct)
          const isConn = connecting === p.id
          return (
            <div key={p.id} className="acct-row" data-on={p.soon ? undefined : on || undefined}>
              <span className="platform-glyph platform-glyph-lg" aria-hidden="true">
                <PlatformMark platform={p.id} size={26} />
              </span>
              <span className="acct-row-text">
                <span className="acct-row-name">
                  <span>{p.name}</span>
                  {on && acct?.username && (
                    <span className="acct-row-handle">@{acct.username}</span>
                  )}
                </span>
                <span className="acct-row-sub">
                  {p.soon
                    ? 'Coming soon'
                    : on
                      ? `Reads followers & engagement · Posts with your approval${
                          ws.synced[p.id] ? ` · Synced ${ws.synced[p.id]}` : ''
                        }`
                      : 'Not connected'}
                </span>
              </span>
              <span className="conn-chip" data-on={p.soon ? undefined : on || undefined}>
                {p.soon ? 'Soon' : on ? 'Connected' : 'Off'}
              </span>
              <span className="acct-row-actions">
                {p.soon ? null : on && acct ? (
                  <button
                    className="btn btn-outline btn-row btn-row-quiet"
                    type="button"
                    disabled={disconnecting === acct.id}
                    aria-label={`Disconnect ${p.name}`}
                    onClick={() => void disconnect(acct)}
                  >
                    {disconnecting === acct.id ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-row btn-row-wide"
                    type="button"
                    disabled={isConn}
                    onClick={() => void connect(p)}
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
      {connectError && (
        <p className="quiet-note" role="alert">
          {connectError}
        </p>
      )}
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
