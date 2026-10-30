import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { GearMark, Icon, type IconName, LogoMark } from '../components/ui'
import {
  api,
  bearer,
  clearSession,
  getSignedInUser,
  getToken,
  isDemoSession
} from '../lib/api'
import { DEMO_NICHE } from '../lib/fixtures'
import {
  claimWorkspace,
  getWorkspace,
  readAudience,
  resetWorkspace,
  useWorkspace
} from '../lib/workspace'

// Pathless layout: sidebar + account menu around every signed-in screen.
// Tokens live in localStorage, so the guard runs client-side only.
export const Route = createFileRoute('/_app')({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: '/onboarding/$step', params: { step: '1' }, replace: true })
    }
  },
  component: AppLayout
})

const SITE = 'https://crowdpilot.hackathons.adophilus.com'

const NAV: {
  to: '/home' | '/audience' | '/directions' | '/plans' | '/accounts' | '/settings'
  label: string
  icon: IconName | null
}[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/audience', label: 'Audience', icon: 'audience' },
  { to: '/directions', label: 'Directions', icon: 'directions' },
  { to: '/plans', label: 'Plans', icon: 'plans' },
  { to: '/accounts', label: 'Accounts', icon: 'link' },
  { to: '/settings', label: 'Settings', icon: null }
]

let profileRequested = false

function AppLayout() {
  // Make sure the workspace belongs to whoever holds the token, then fetch the
  // real Qloo profile once if we don't have one yet.
  useEffect(() => {
    const user = getSignedInUser()
    if (user) claimWorkspace({ email: user.email })
    else if (isDemoSession()) claimWorkspace('demo')
    const ws = getWorkspace()
    if (!ws.profile && !profileRequested) {
      profileRequested = true
      void readAudience(ws.niche || DEMO_NICHE)
    }
  }, [])

  return (
    <div className="shell">
      <Sidebar />
      <Outlet />
    </div>
  )
}

function Sidebar() {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const acctRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!acctRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const signOut = async () => {
    setOpen(false)
    try {
      await api.POST('/auth/logout', bearer())
    } catch {
      /* offline: still sign out locally */
    }
    clearSession()
    resetWorkspace()
    profileRequested = false
    void navigate({ to: '/onboarding/$step', params: { step: '1' }, replace: true })
  }

  const name = ws.business.name || 'Your workspace'
  const initials =
    name
      .replace(/[^A-Za-z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'CP'
  const count = Object.values(ws.connected).filter(Boolean).length
  const sub = [ws.business.city, `${count} account${count === 1 ? '' : 's'}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <nav className="sidebar" aria-label="Main">
      <Link to="/home" className="sidebar-brand">
        <LogoMark size={26} />
        <span className="wordmark-text wordmark-sm">CrowdPilot</span>
      </Link>
      <div className="navlist">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="nav"
            activeProps={{ 'aria-current': 'page', className: 'is-active' }}
            aria-label={n.label}
          >
            {n.icon ? <Icon name={n.icon} size={18} /> : <GearMark size={18} />}
            <span className="navlabel">{n.label}</span>
          </Link>
        ))}
      </div>
      <div className="acct" ref={acctRef}>
        {open && (
          <div className="acctmenu" role="menu" aria-label="Account">
            <div className="acctmenu-head">
              <span>Workspace</span>
              <strong>{name}</strong>
            </div>
            <Link
              to="/settings"
              role="menuitem"
              className="mi"
              onClick={() => setOpen(false)}
            >
              <GearMark size={16} />
              Workspace settings
            </Link>
            <Link
              to="/accounts"
              role="menuitem"
              className="mi"
              onClick={() => setOpen(false)}
            >
              <Icon name="link" size={16} stroke={1.9} />
              Connected accounts
            </Link>
            <a
              role="menuitem"
              className="mi"
              href={`${SITE}/#help`}
              target="_blank"
              rel="noopener"
            >
              <Icon name="help" size={16} stroke={1.9} />
              Help &amp; feedback
              <Icon name="external" size={14} stroke={2} className="mi-ext" />
            </a>
            <div className="mi-rule" />
            <button
              type="button"
              role="menuitem"
              className="mi mi-danger"
              onClick={() => void signOut()}
            >
              <Icon name="signOut" size={16} stroke={1.9} />
              Sign out
            </button>
          </div>
        )}
        <button
          className="acctbtn"
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${name} account menu`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="acct-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="acct-text">
            <span className="acct-name">{name}</span>
            <span className="acct-sub">{sub}</span>
          </span>
          <Icon
            name="chevUp"
            size={16}
            stroke={2}
            className="acct-chev"
            style={{ transform: `rotate(${open ? 0 : 180}deg)` }}
          />
        </button>
      </div>
    </nav>
  )
}
