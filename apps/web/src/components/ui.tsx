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

// Monochrome brand marks for the platforms CrowdPilot can read/post
// (fill-based, not part of the stroke Icon system).
const PLATFORM_PATHS = {
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  fb: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  ig: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'
} as const

export function PlatformMark({
  platform,
  size = 20
}: {
  platform: 'x' | 'fb' | 'ig'
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={PLATFORM_PATHS[platform]} />
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
