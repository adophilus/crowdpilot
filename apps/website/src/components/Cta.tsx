import { Icon } from './Icon'

type CtaProps = {
  href: string
  children: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'dark' | 'light'
  external?: boolean
}

// Primary call to action: dark pill with a white arrow bubble that turns
// accent and nudges right on hover.
export function Cta({
  href,
  children,
  size = 'lg',
  tone = 'dark',
  external
}: CtaProps) {
  const cls = [
    'cta',
    size !== 'lg' && `cta--${size}`,
    tone === 'light' && 'cta--light'
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <a
      className={cls}
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
      <span className="cta__arrow" aria-hidden="true">
        <Icon name="arrow" size={14} strokeWidth={2.2} />
      </span>
    </a>
  )
}
