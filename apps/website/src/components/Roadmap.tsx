import { type RefObject, useEffect, useRef, useState } from 'react'

const MILESTONES = [
  {
    v: '01',
    short: 'Pre Launch',
    title: 'Getting the core right',
    body: 'Connect your socials, see your audience’s taste, pick a direction and act on it.'
  },
  {
    v: '02',
    short: 'Post Launch',
    title: 'Everywhere your audience is',
    body: 'More platforms, team workspaces, MCP servers, custom agents and more…'
  }
]

// Scroll-linked: progress runs 0 → 1 while the section's top travels from
// 80% to 20% of the viewport; slides swap and the bars fill along with it.
function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [prog, setProg] = useState(0)
  useEffect(() => {
    let raf = 0
    let last = -1
    const measure = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      const vh = Math.min(window.innerHeight || 800, 900)
      const p = Math.max(0, Math.min(1, (vh * 0.8 - top) / (vh * 0.6)))
      if (Math.abs(p - last) > 0.004) {
        last = p
        setProg(p)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    document.addEventListener('scroll', onScroll, {
      capture: true,
      passive: true
    })
    window.addEventListener('resize', onScroll)
    measure()
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
  return prog
}

export function Roadmap() {
  const ref = useRef<HTMLElement>(null)
  const prog = useScrollProgress(ref)
  const n = MILESTONES.length
  const idx = Math.min(n - 1, Math.floor(prog * n))

  return (
    <section
      id="roadmap"
      ref={ref}
      className="roadmap"
      aria-labelledby="roadmap-h"
    >
      <div className="roadmap__card">
        <div className="roadmap__head">
          <span className="roadmap__pill">Roadmap</span>
          <h2 id="roadmap-h" className="roadmap__h">
            Where We’re Headed
          </h2>
        </div>
        <div className="roadmap__stage">
          {MILESTONES.map((m, i) => (
            <div
              key={m.v}
              className={`slide${i === idx ? ' is-current' : ''}${i < idx ? ' is-past' : ''}`}
              aria-hidden={i !== idx}
            >
              <div className="slide__num">{m.v}</div>
              <div className="slide__body">
                <span className="slide__tag">{m.short}</span>
                <h3 className="slide__title">{m.title}</h3>
                <p className="slide__text">{m.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="progress" aria-hidden="true">
          {MILESTONES.map((m, i) => {
            const fill = Math.max(0, Math.min(1, prog * n - i))
            return (
              <div key={m.v}>
                <div className="progress__track">
                  <div
                    className="progress__fill"
                    style={{ width: `${(fill * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className={`progress__label${i <= idx ? ' is-on' : ''}`}>
                  {m.v} · {m.short}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
