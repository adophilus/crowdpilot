import { useState } from 'react'
import { ISSUES_URL, NEW_ISSUE_URL } from '../lib/links'
import { Cta } from './Cta'
import { Icon } from './Icon'

const FAQS = [
  [
    'What does CrowdPilot actually do?',
    'It reads the taste of your audience, or of a niche you want to reach, suggests directions to grow, and turns the one you pick into a plan it can carry out: playlists, posts, event ideas and more.'
  ],
  [
    'Which accounts can I connect?',
    'X (Twitter), Facebook and TikTok for now, with more platforms on the way. No socials yet? Just describe your audience or the niche you’re after.'
  ],
  [
    'Will CrowdPilot post without asking me?',
    'No. By default nothing goes out until you approve it. You can change how approvals work in Settings.'
  ],
  [
    'What does it read from my accounts?',
    'Only audience signals, like who follows you and how they engage with your posts.'
  ],
  [
    'Where do the taste insights come from?',
    'From Qloo’s taste graph, which connects what people love across music, food, places, brands, film and more.'
  ]
] as const

export function Help() {
  const [open, setOpen] = useState(0)

  return (
    <section id="help" className="section help" aria-labelledby="help-h">
      <div className="section-head">
        <span className="pill">Help &amp; feedback</span>
        <h2 id="help-h" className="h2">
          Questions? We've got you.
        </h2>
        <p className="lede" style={{ maxWidth: 'none' }}>
          The things people ask most, and a direct line to us for everything
          else.
        </p>
      </div>
      <div className="help-wrap">
        <div className="faqs">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className={`faq${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    {q}
                    <span className="faq__icon" aria-hidden="true">
                      <Icon name="plus" size={14} strokeWidth={2.4} />
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <p id={`faq-a-${i}`} className="faq__a fade-in">
                    {a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <aside className="feedback" aria-label="Send feedback">
          <span className="feedback__icon" aria-hidden="true">
            <Icon name="chat" size={22} strokeWidth={2} />
          </span>
          <h3>Still stuck, or got an idea?</h3>
          <p>
            Tell us what's confusing, what's broken or what you wish CrowdPilot
            could do. We read every message.
          </p>
          <Cta href={NEW_ISSUE_URL} tone="light" external>
            Send feedback
          </Cta>
          <a
            className="feedback__link"
            href={ISSUES_URL}
            target="_blank"
            rel="noreferrer"
          >
            Found a bug? Report it on GitHub
          </a>
        </aside>
      </div>
    </section>
  )
}
