import type { Profile } from '../lib/api'

const DOMAIN_LABEL: Record<string, string> = {
  artist: 'Music',
  place: 'Places',
  brand: 'Brands',
  movie: 'On screen',
  tv_show: 'On screen',
  book: 'Reading',
  destination: 'Destinations'
}

export function ProfileCard({
  profile,
  stage,
  crowdName,
  crowdPlace
}: {
  profile: Profile | null
  stage: 'empty' | 'loading' | 'ready'
  crowdName: string
  crowdPlace: string
}) {
  if (stage === 'loading') {
    return (
      <div className="loading-shimmer" aria-live="polite">
        <span className="spinner" />
        Reading the room — asking Qloo what your crowd loves…
      </div>
    )
  }

  if (stage === 'empty' || !profile) {
    return (
      <div className="profile-empty">
        <strong>No crowd profile yet</strong>
        Tell the co-pilot what the people who fill your room love — or hit “Try
        the demo café” to see a finished profile.
      </div>
    )
  }

  return (
    <article className="profile-card" aria-label="Crowd taste profile">
      <div className="assemble">
        <header style={{ ['--i' as string]: 0 }}>
          <p className="eyebrow">Crowd profile</p>
          <h2 className="profile-title">{crowdName}</h2>
          <p className="profile-place">{crowdPlace}</p>
        </header>

        <div style={{ ['--i' as string]: 1 }}>
          <h3 className="section-label">What they're into</h3>
          <div className="tag-row">
            {profile.topTags.map((tag, i) => (
              <div className="tag-line" key={tag.tag}>
                <span className="tag-name">{tag.tag}</span>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.round(tag.score * 100)}%`, ['--i' as string]: i }}
                  />
                </div>
                <span className="tag-score">{tag.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {profile.affinities.map((affinity, di) => (
          <div key={affinity.domain} style={{ ['--i' as string]: di + 2 }}>
            <div className="domain-block">
              <div className="domain-head">
                <h3 className="section-label" style={{ margin: '0 0 4px' }}>
                  {DOMAIN_LABEL[affinity.domain] ?? affinity.domain}
                </h3>
              </div>
              {affinity.picks.map((pick) => (
                <div className="pick-row" key={pick.id}>
                  <span className="pick-name">{pick.name}</span>
                  <span className="pick-score">{pick.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <footer className="card-footer" style={{ ['--i' as string]: profile.affinities.length + 3 }}>
          <span className="qmark">✳</span>
          Grounded in {profile.evidenceRefs.length} Qloo calls — every number traceable
        </footer>
      </div>
    </article>
  )
}
