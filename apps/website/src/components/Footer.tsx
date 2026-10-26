import { DEMO_URL, GET_STARTED_URL, REPO_URL } from '../lib/links'
import { Cta } from './Cta'
import { Icon, type IconName } from './Icon'
import { Wordmark } from './Logo'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#crowds', label: 'Use cases' },
  { href: DEMO_URL, label: 'Live demo' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#help', label: 'Help & feedback' },
  { href: REPO_URL, label: 'GitHub repo', external: true }
]

const TILES: {
  icon: IconName
  left: string
  top: number
  rotate: number
  accent?: boolean
}[] = [
  { icon: 'music', left: '6%', top: 40, rotate: -10 },
  { icon: 'cup', left: '24%', top: 100, rotate: 8 },
  { icon: 'doc', left: '44%', top: 30, rotate: -8 },
  { icon: 'pin', left: '63%', top: 110, rotate: 12 },
  { icon: 'send', left: '82%', top: 36, rotate: -6, accent: true }
]

function FooterArt() {
  return (
    <div className="footer__art" aria-hidden="true">
      <svg
        className="footer__path"
        width="100%"
        height="200"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M86 73C176 73 176 133 266 133C366 133 366 63 466 63C561 63 561 143 656 143C700 143 700 114 744 114C766.7 114 766.7 66 744 66C721.3 66 721.3 114 744 114C778 114 778 86 812 86"
          fill="none"
          stroke="#A9A9A2"
          strokeWidth="1.6"
          strokeDasharray="5 6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="footer__chev">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M3 2L12 7L3 12"
            fill="none"
            stroke="#8A8A83"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {TILES.map((t) => (
        <div
          key={t.icon}
          className={`tile${t.accent ? ' tile--accent' : ''}`}
          style={{
            left: t.left,
            top: t.top,
            transform: `rotate(${t.rotate}deg)`
          }}
        >
          <Icon
            name={t.icon}
            size={t.accent ? 32 : 30}
            strokeWidth={t.accent ? 2 : 1.7}
          />
        </div>
      ))}
    </div>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div>
          <div className="footer__brand">
            <Wordmark size={26} />
          </div>
          <h2 className="footer__title">
            Find your people.
            <br />
            Know them better.
            <br />
            <span>Grow with them.</span>
          </h2>
          <Cta href={GET_STARTED_URL}>Get Started</Cta>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          {LINKS.map((l) => (
            <a
              key={l.label}
              className="navlink"
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <FooterArt />
      <div className="footer__legal">
        <span>© 2026 CrowdPilot · MIT licensed</span>
        <span>
          Taste data by{' '}
          <a href="https://www.qloo.com" target="_blank" rel="noreferrer">
            Qloo
          </a>
        </span>
      </div>
    </footer>
  )
}
