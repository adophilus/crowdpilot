// Brand mark — compass: ink ring, accent needle pointing NE, ink tail SW.
export function LogoMark({
  size = 30,
  ink = 'currentColor'
}: {
  size?: number
  ink?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke={ink}
        strokeWidth="3.5"
      />
      <path d="M33.5 14.5L27 27L21 21Z" fill="var(--accent)" />
      <path d="M14.5 33.5L21 21L27 27Z" fill={ink} />
    </svg>
  )
}

export function Wordmark({
  href = '#top',
  size = 30
}: {
  href?: string
  size?: number
}) {
  return (
    <a href={href} className="brand" aria-label="CrowdPilot home">
      <LogoMark size={size} />
      <span className="brand__name">CrowdPilot</span>
    </a>
  )
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><style>.r{stroke:#141414}.i{fill:#141414}@media (prefers-color-scheme:dark){.r{stroke:#fafaf8}.i{fill:#fafaf8}}</style><circle class="r" cx="24" cy="24" r="17" fill="none" stroke-width="3.5"/><path d="M33.5 14.5L27 27L21 21Z" fill="#E5532A"/><path class="i" d="M14.5 33.5L21 21L27 27Z"/></svg>`

export const FAVICON_HREF = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`
