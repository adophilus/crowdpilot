import { Icon, type IconName } from './Icon'

const GOALS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'target',
    title: 'Break into a niche',
    body: 'Pick the crowd you want to win. CrowdPilot maps what they already love, so your first posts, products and events speak their language from day one.'
  },
  {
    icon: 'heart',
    title: 'Go deeper with your audience',
    body: 'Turn followers and regulars into a real taste profile. Know the songs, spots and brands that make them feel seen, and give them more of it.'
  },
  {
    icon: 'niches',
    title: 'Find the niches inside your niche',
    body: "Spot the sub-scenes and crossover crowds your audience over-indexes on. That's where your next wave of followers or customers is hiding."
  }
]

export function WhatItDoes() {
  return (
    <section id="what" className="section what" aria-labelledby="what-h">
      <div className="section-head">
        <span className="pill">What it does for you</span>
        <h2 id="what-h" className="h2">
          Reach the audience you want.
          <br />
          Grow the one you have.
        </h2>
      </div>
      <div className="goals">
        {GOALS.map((g) => (
          <div key={g.title} className="goal">
            <Icon name={g.icon} size={26} />
            <h3>{g.title}</h3>
            <p>{g.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
