import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

const STAR =
  'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z'

function Star({ fill, label }: { fill: number; label: string }) {
  return (
    <span className="star" role="img" aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={STAR}
          fill="#E6E6E0"
          stroke="#CFCFC8"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="star__fill" style={{ width: `${fill}%` }}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d={STAR}
            fill="var(--accent)"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  )
}

function Step({
  n,
  tag,
  title,
  body,
  arrow,
  children
}: {
  n: number
  tag: string
  title: string
  body: string
  arrow?: boolean
  children: ReactNode
}) {
  return (
    <li className="step">
      {arrow && (
        <div className="step__arrow" aria-hidden="true">
          <Icon name="arrow" size={20} strokeWidth={2.4} />
        </div>
      )}
      <div className="step__label">
        <span className="step__num" aria-hidden="true">
          {n}
        </span>
        <span className="step__tag">
          <span className="sr-only">Step {n}: </span>
          {tag}
        </span>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {children}
    </li>
  )
}

const SOCIALS: { name: string; icon: IconName }[] = [
  { name: 'X (Twitter)', icon: 'x' },
  { name: 'Facebook', icon: 'facebook' },
  { name: 'TikTok', icon: 'tiktok' }
]

function ProfileVisual() {
  return (
    <div className="step__visual" style={{ gap: 12 }}>
      <div className="socials">
        {SOCIALS.map((s) => (
          <div
            key={s.name}
            className="social"
            role="img"
            aria-label={`${s.name}, connected`}
            title={s.name}
          >
            <Icon name={s.icon} size={20} strokeWidth={1.9} />
            <span className="social__ok">
              <Icon name="check" size={8} strokeWidth={4} />
            </span>
          </div>
        ))}
        <div className="social social--add" aria-hidden="true">
          <Icon name="plus" size={18} strokeWidth={2} />
        </div>
      </div>
      <svg
        className="radar"
        viewBox="0 0 200 172"
        role="img"
        aria-label="Taste profile: strongest in music, then food, places, brands and film"
      >
        <polygon
          points="100,26 159,68.8 136.5,138.2 63.5,138.2 41,68.8"
          fill="#FFFFFF"
          stroke="#DCDCD5"
          strokeWidth="1"
        />
        <polygon
          points="100,57 129.5,78.4 118.3,113.1 81.7,113.1 70.5,78.4"
          fill="none"
          stroke="#E6E6E0"
          strokeWidth="1"
        />
        <path
          d="M100 88L100 26M100 88L159 68.8M100 88L136.5 138.2M100 88L63.5 138.2M100 88L41 68.8"
          stroke="#E6E6E0"
          strokeWidth="1"
        />
        <polygon
          points="100,31 149.6,71.9 125.9,123.6 75.9,121.1 70.5,78.4"
          fill="var(--accent)"
          fillOpacity="0.22"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {[
          [100, 31],
          [149.6, 71.9],
          [125.9, 123.6],
          [75.9, 121.1],
          [70.5, 78.4]
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="3" fill="var(--accent)" />
        ))}
        <text x="100" y="16" textAnchor="middle">
          Music
        </text>
        <text x="165" y="66" textAnchor="start">
          Food
        </text>
        <text x="140" y="156" textAnchor="middle">
          Places
        </text>
        <text x="60" y="156" textAnchor="middle">
          Brands
        </text>
        <text x="35" y="66" textAnchor="end">
          Film
        </text>
      </svg>
    </div>
  )
}

function DecideVisual() {
  return (
    <div className="step__visual">
      <div className="branch">
        <div
          className="audience"
          role="img"
          aria-label="Your audience"
          title="Your audience"
        >
          <Icon name="audience" size={24} strokeWidth={1.9} />
        </div>
        <svg
          width="34"
          height="136"
          viewBox="0 0 34 136"
          aria-hidden="true"
          style={{ flexShrink: 0, display: 'block' }}
        >
          <path
            d="M0 68C17 68 17 20 34 20"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
          />
          <path
            d="M0 68H34M0 68C17 68 17 116 34 116"
            fill="none"
            stroke="#BDBDB6"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>
        <div className="options">
          <div className="option option--top">
            <span>Brunch sessions</span>
            <Star fill={100} label="Strong match" />
            <span className="option__flag">Recommended</span>
          </div>
          <div className="option">
            <span>Afro-house night</span>
            <Star fill={60} label="Good match" />
          </div>
          <div className="option">
            <span>Streetwear collab</span>
            <Star fill={35} label="Possible match" />
          </div>
        </div>
      </div>
      <div className="btn-row">
        <span className="fake-btn">Proceed</span>
      </div>
    </div>
  )
}

const PLAN = [
  { label: 'Build the brunch playlist', status: 'Done', done: true },
  { label: 'Draft the announcement', status: 'Done', done: true },
  { label: 'Post to Instagram & TikTok', status: 'Sat 10:00', done: false }
]

function ActVisual() {
  return (
    <div className="step__visual step__visual--dark">
      <div className="plan__title">Plan · Brunch sessions</div>
      {PLAN.map((p) => (
        <div key={p.label} className="plan__item">
          <span className={`tick${p.done ? '' : ' tick--pending'}`}>
            {p.done ? (
              <Icon name="check" size={11} strokeWidth={3} stroke="#FFFFFF" />
            ) : (
              <Icon name="clock" size={11} strokeWidth={2.4} stroke="#D9D9D3" />
            )}
          </span>
          <span>{p.label}</span>
          <span className="plan__status">{p.status}</span>
        </div>
      ))}
      <div className="btn-row" style={{ marginTop: 4 }}>
        <span className="fake-btn">Run it now</span>
        <span className="fake-btn fake-btn--ghost">Keep schedule</span>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="how" aria-labelledby="how-h">
      <div className="how__inner">
        <div className="section-head">
          <span className="pill">How it works</span>
          <h2 id="how-h" className="h2">
            Three steps, one conversation
          </h2>
          <p className="lede">
            From “who are they?” to “it’s done.” Works for the audience you have
            or the one you want.
          </p>
        </div>
        <ol
          className="how__grid"
          style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}
        >
          <Step
            n={1}
            tag="Profile"
            title="Connect your socials"
            body="CrowdPilot looks at who follows and engages with you, then maps their taste across music, food, places, brands and more. Going after a new niche? Just name it instead."
            arrow
          >
            <ProfileVisual />
          </Step>
          <Step
            n={2}
            tag="Decide"
            title="Pick a direction"
            body="CrowdPilot suggests where to take your audience next, ranks the options and shows why. You choose the one to go with."
            arrow
          >
            <DecideVisual />
          </Step>
          <Step
            n={3}
            tag="Act"
            title="Make it happen"
            body="CrowdPilot turns your direction into a plan and carries it out: posts in your voice, playlists, event listings, outreach. Run it now or schedule it."
          >
            <ActVisual />
          </Step>
        </ol>
      </div>
    </section>
  )
}
