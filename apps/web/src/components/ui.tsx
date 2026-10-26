import type { CSSProperties } from 'react'
import type { MatchFill } from '../lib/fixtures'
import { matchLabel } from '../lib/fixtures'

// Stroke icon paths lifted from the design artboards.
export const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  audience: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  directions: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
  plans: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01',
  external:
    'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  signOut: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10',
  chevUp: 'M6 15l6-6 6 6',
  chevDown: 'M6 9l6 6 6-6',
  check: 'M5 12l5 5L20 7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  send: 'M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l2.5 1.5',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6'
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  d,
  size = 18,
  stroke = 1.8,
  style,
  className
}: {
  name?: IconName
  d?: string
  size?: number
  stroke?: number
  style?: CSSProperties
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      <path d={d ?? (name ? ICONS[name] : '')} />
    </svg>
  )
}

// The CrowdPilot mark: a ring with a two-tone compass needle.
// The official Google "G" — four-color filled mark per Google identity
// guidelines. Not part of the stroke Icon system: fixed fills, no currentColor.
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26a5.55 5.55 0 0 1-8.09-2.9H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.66a5.41 5.41 0 0 1 0-3.32V5H.96a9 9 0 0 0 0 8l3-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 5l3 2.33A5.36 5.36 0 0 1 9 3.58z"
      />
    </svg>
  )
}

export function LogoMark({
  size = 28,
  tone = 'dark'
}: {
  size?: number
  tone?: 'dark' | 'light'
}) {
  const ink = tone === 'dark' ? 'var(--ink)' : '#FFFFFF'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="17" fill="none" stroke={ink} strokeWidth="3.5" />
      <path d="M33.5 14.5L27 27L21 21Z" fill="var(--accent)" />
      <path d="M14.5 33.5L21 21L27 27Z" fill={ink} />
    </svg>
  )
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="wordmark">
      <LogoMark size={size} />
      <span className="wordmark-text">CrowdPilot</span>
    </span>
  )
}

// Pilot's avatar: the mark reversed out of an ink circle.
export function PilotAvatar({
  size = 34,
  inverse = false
}: {
  size?: number
  inverse?: boolean
}) {
  return (
    <span
      className={`pilot-avatar${inverse ? ' is-inverse' : ''}`}
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <LogoMark
        size={Math.round(size * 0.58)}
        tone={inverse ? 'dark' : 'light'}
      />
    </span>
  )
}

const STAR =
  'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z'

export function MatchStar({ fill }: { fill: MatchFill }) {
  const label = matchLabel(fill)
  return (
    <span className="star" role="img" aria-label={label} title={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d={STAR} fill="#E6E6E0" stroke="#CFCFC8" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className="star-fill" style={{ width: `${fill}%` }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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

// Five-axis taste fingerprint. Values are 0..1 per axis.
const AXES = [
  { key: 'music', label: 'Music', x: 100, y: 16, anchor: 'middle' },
  { key: 'food', label: 'Food', x: 165, y: 66, anchor: 'start' },
  { key: 'places', label: 'Places', x: 140, y: 156, anchor: 'middle' },
  { key: 'brands', label: 'Brands', x: 60, y: 156, anchor: 'middle' },
  { key: 'film', label: 'Film', x: 35, y: 66, anchor: 'end' }
] as const

export type RadarValues = Record<(typeof AXES)[number]['key'], number>

const point = (i: number, r: number) => {
  const a = ((-90 + i * 72) * Math.PI) / 180
  return `${(100 + Math.cos(a) * r).toFixed(1)},${(88 + Math.sin(a) * r).toFixed(1)}`
}
const ring = (r: number) => AXES.map((_, i) => point(i, r)).join(' ')

export function Radar({
  values,
  className
}: {
  values: RadarValues
  className?: string
}) {
  const ranked = [...AXES]
    .sort((a, b) => values[b.key] - values[a.key])
    .map((a) => a.label.toLowerCase())
  const label = `Taste profile: strongest in ${ranked[0]}, then ${ranked.slice(1, -1).join(', ')} and ${ranked[ranked.length - 1]}`
  return (
    <svg
      width="100%"
      viewBox="0 0 200 172"
      role="img"
      aria-label={label}
      className={className}
      style={{ display: 'block' }}
    >
      <polygon points={ring(62)} fill="#F7F7F4" stroke="#DCDCD5" strokeWidth="1" />
      <polygon points={ring(31)} fill="none" stroke="#E6E6E0" strokeWidth="1" />
      <path
        d={AXES.map((_, i) => `M100 88L${point(i, 62).replace(',', ' ')}`).join('')}
        stroke="#E6E6E0"
        strokeWidth="1"
      />
      <polygon
        className="radar-shape"
        points={AXES.map((a, i) => point(i, 62 * values[a.key])).join(' ')}
        fill="var(--accent)"
        fillOpacity="0.22"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {AXES.map((a) => (
        <text
          key={a.key}
          x={a.x}
          y={a.y}
          textAnchor={a.anchor}
          fontSize="11"
          fill="#3a3a37"
          fontFamily="var(--font-body)"
        >
          {a.label}
        </text>
      ))}
    </svg>
  )
}
