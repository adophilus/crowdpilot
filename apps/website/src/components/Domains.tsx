import { Icon } from './Icon'

// The ten Qloo entity domains CrowdPilot reads across.
const DOMAINS = [
  {
    label: 'Artists',
    icon: 'M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    blurb: 'What they play on repeat',
    more: 'Genres, artists and scenes your crowd over-indexes on, scored against your city’s baseline.'
  },
  {
    label: 'Brands',
    icon: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
    blurb: 'The labels they trust',
    more: 'Brands your crowd already buys into, for stock, sponsors and collabs.'
  },
  {
    label: 'Places',
    icon: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    blurb: 'Where they spend their evenings',
    more: 'The cafés, bars and venues your crowd frequents, so you know who you’re really competing with.'
  },
  {
    label: 'Movies',
    icon: 'M3 4h18v16H3zM7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4',
    blurb: 'What they watch on the big screen',
    more: 'Film taste feeds theme nights, decor and the references your posts can make.'
  },
  {
    label: 'TV shows',
    icon: 'M3 7h18v12H3zM8 3l4 4 4-4',
    blurb: 'What they binge',
    more: 'Series affinity shows the stories and humor that land with this crowd.'
  },
  {
    label: 'Books',
    icon: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3',
    blurb: 'What they read',
    more: 'Book taste hints at the values and interests behind events, menus and content.'
  },
  {
    label: 'Podcasts',
    icon: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3',
    blurb: 'Who they listen to',
    more: 'The voices your crowd trusts, and the hosts worth pitching for a collab.'
  },
  {
    label: 'Video games',
    icon: 'M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4zM7 11v3M5.5 12.5h3M16 12h.01M18 13.5h.01',
    blurb: 'What they play',
    more: 'Gaming taste opens up tournament nights, collabs and in-jokes that land.'
  },
  {
    label: 'Destinations',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    blurb: 'Where they travel',
    more: 'Travel taste shapes themed menus, playlists and trip-style promotions.'
  },
  {
    label: 'People',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    blurb: 'Who they follow',
    more: 'The creators and public figures your crowd connects with, for partnerships and tone.'
  }
]

export function Domains() {
  return (
    <section className="section domains" aria-labelledby="domains-h">
      <span className="pill">One graph</span>
      <h2 id="domains-h" className="h2">
        Everything’s connected
      </h2>
      <p className="lede" style={{ maxWidth: 580 }}>
        A crowd’s music says something about its food, its spots and the brands
        it trusts. CrowdPilot reads across ten domains to find those crossovers.
      </p>
      <div className="bleed" style={{ marginTop: 56 }}>
        <div className="marquee">
          <ul
            className="track"
            aria-label="Cultural domains"
            style={{ listStyle: 'none', margin: 0 }}
          >
            {DOMAINS.map((d) => (
              <li key={d.label} className="dcard">
                <div className="dcard__ph" aria-hidden="true">
                  <Icon d={d.icon} size={120} strokeWidth={1} />
                </div>
                <div className="dcard__ov" />
                <div className="dcard__body">
                  <div className="dcard__label">
                    <span className="dcard__icon">
                      <Icon d={d.icon} size={18} />
                    </span>
                    {d.label}
                  </div>
                  <div className="dcard__blurb">{d.blurb}</div>
                  <p className="dcard__more">{d.more}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
