import type { SVGProps } from 'react'

// Stroke icon paths (24x24 grid). Multi-part icons are joined into one `d`.
export const ICONS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12l5 5L20 7',
  plus: 'M12 5v14M5 12h14',
  send: 'M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z',
  doc: 'M6 3h9l4 4v14H6zM9 12h7M9 16h5',
  chat: 'M4 5h16v11H8l-4 4z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l2.5 1.5',
  target:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 10.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  niches:
    'M6 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM18 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 8.5v1.5a4 4 0 0 0 4 4h.5M18 8.5v1.5a4 4 0 0 1-4 4h-.5M12 14v1.5',
  music:
    'M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  cup: 'M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM7 2v3M11 2v3',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  audience:
    'M12 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM6 19.5a6 6 0 0 1 12 0M5 7.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zM1.5 18a4 4 0 0 1 4.6-3.9M19 7.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zM22.5 18a4 4 0 0 0-4.6-3.9',
  x: 'M4 4l16 16M20 4L4 20',
  facebook:
    'M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z',
  tiktok: 'M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.3 4.4 5 4.7'
} as const

export type IconName = keyof typeof ICONS

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name?: IconName
  d?: string
  size?: number
  stroke?: string
  strokeWidth?: number
}

export function Icon({
  name,
  d,
  size = 24,
  stroke = 'currentColor',
  strokeWidth = 1.8,
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d ?? (name ? ICONS[name] : '')} />
    </svg>
  )
}
