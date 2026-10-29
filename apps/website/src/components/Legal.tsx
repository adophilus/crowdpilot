import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Nav } from './Nav'

// Shared shell for the terms / privacy pages. Copy lives in the routes.
export function Legal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="page">
      <div className="frame">
        <Nav />
        <main>
          <article className="legal">
            <span className="pill">CrowdPilot</span>
            <h1>{title}</h1>
            {children}
            <p className="legal-contact">
              Questions? Email{' '}
              <a href="mailto:hackathons@adophilus.com">hackathons@adophilus.com</a>.
            </p>
            <p>
              <a href="/">← Back to crowdpilot.hackathons.adophilus.com</a>
            </p>
          </article>
        </main>
        <Footer />
      </div>
    </div>
  )
}
