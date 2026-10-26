import { GET_STARTED_URL } from '../lib/links'
import { Cta } from './Cta'
import { Icon } from './Icon'
import { LogoMark } from './Logo'

const FINGERPRINT = [
  { label: 'Music', value: 0.92 },
  { label: 'Food & drink', value: 0.84 },
  { label: 'Places', value: 0.71, accent: true }
]

function FloatingCards() {
  return (
    <>
      <div className="float fl-l sticky-note" aria-hidden="true">
        <div className="sticky-note__pin" />
        Who else would love what you do?
      </div>

      <div className="float fl-l float-card fingerprint" aria-hidden="true">
        <div className="fingerprint__head">
          <div style={{ fontWeight: 600, fontSize: 15 }}>Crowd fingerprint</div>
          <div className="small-muted">Kofi's Café</div>
        </div>
        <div className="fingerprint__rows">
          {FINGERPRINT.map((r) => (
            <div key={r.label}>
              <div className="meter__row">
                <span>{r.label}</span>
                <span className="meter__val">{r.value.toFixed(2)}</span>
              </div>
              <div className="meter__track">
                <div
                  className="meter__fill"
                  style={{
                    width: `${Math.round(r.value * 100)}%`,
                    background: r.accent ? 'var(--accent)' : undefined
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="float fl-r float-card decision" aria-hidden="true">
        <div className="kicker" style={{ marginBottom: 8 }}>
          Decision
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>
          Saturday brunch playlist
        </div>
        <div className="decision__pick">
          <span>Alté &amp; soft Afrobeats</span>
          <span className="score-badge">0.94</span>
        </div>
        <div className="chips">
          <span className="chip">3 receipts</span>
          <span className="chip">via taste graph</span>
        </div>
      </div>

      <div className="float fl-r float-card shipcard" aria-hidden="true">
        <div className="shipcard__head">
          <div className="icon-tile">
            <Icon name="send" size={18} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Action scheduled
            </div>
            <div className="small-muted">Sat · 10:00 · Social</div>
          </div>
        </div>
        <div className="shipcard__body">
          Brunch just got a soundtrack. Soft Afrobeats from 10am, pour-overs all
          day.
        </div>
      </div>
    </>
  )
}

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <FloatingCards />
      <div className="hero__copy">
        <div className="hero__mark rise rise-1">
          <LogoMark size={54} ink="var(--ink)" />
        </div>
        <div className="hero__badge rise rise-2">
          <span className="dot" />
          Grounded in Qloo's taste graph · 250M+ cultural entities
        </div>
        <h1 id="hero-title" className="hero__title rise rise-3">
          Find your people.
          <br />
          <span>Then keep them close.</span>
        </h1>
        <p className="hero__sub rise rise-4">
          CrowdPilot reads the taste of the audience you have, and the one you
          want. It shows you what they love, where else they hang out, and what
          to post, host or stock next.
        </p>
        <div className="hero__ctas rise rise-5">
          <Cta href={GET_STARTED_URL}>Get Started</Cta>
          <a className="btn-light hero__secondary" href="#how">
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}
