import { createFileRoute } from '@tanstack/react-router'
import { Legal } from '../components/Legal'

export const Route = createFileRoute('/terms')({
  component: () => (
    <Legal title="Terms of Service">
      <p className="legal-updated">Last updated: October 2026</p>
      <p>
        CrowdPilot is a hackathon preview. By creating an account you agree to
        the terms below. They're short on purpose.
      </p>
      <h2>What the service does</h2>
      <p>
        CrowdPilot analyzes audience taste signals (via Qloo and your connected
        social accounts) and drafts content for your business. Nothing is ever
        posted without your explicit approval.
      </p>
      <h2>Your accounts</h2>
      <p>
        You connect your own social accounts through our publishing partner.
        You can disconnect them at any time from the Accounts page. We only
        read audience signals like follows and engagement. We never DM, like,
        or follow anyone as you.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Don't use CrowdPilot to spam, harass, or break the rules of the
        platforms you post to. Your posts are yours. You own what you create
        and publish.
      </p>
      <h2>No warranty</h2>
      <p>
        The service is provided as-is for evaluation during the hackathon. We
        may change or discontinue parts of it at any time. Taste insights are
        directional, not guarantees.
      </p>
    </Legal>
  )
})
