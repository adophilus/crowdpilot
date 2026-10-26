import { DEMO_URL, GET_STARTED_URL } from '../lib/links'
import { Cta } from './Cta'
import { Wordmark } from './Logo'

const LINKS = [
  { href: '#what', label: 'What it does' },
  { href: '#how', label: 'How it works' },
  { href: '#crowds', label: 'Use cases' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#help', label: 'Help' }
]

export function Nav() {
  return (
    <header className="nav">
      <Wordmark />
      <nav className="nav__mid" aria-label="Main">
        {LINKS.map((l) => (
          <a key={l.href} className="navlink" href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="nav__actions">
        <a className="btn-light nav__secondary hide-sm" href={DEMO_URL}>
          See it in action
        </a>
        <Cta href={GET_STARTED_URL} size="sm">
          Get Started
        </Cta>
      </div>
    </header>
  )
}
