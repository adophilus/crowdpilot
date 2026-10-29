import { createFileRoute } from '@tanstack/react-router'
import { Legal } from '../components/Legal'

export const Route = createFileRoute('/privacy')({
  component: () => (
    <Legal title="Privacy Policy">
      <p className="legal-updated">Last updated: October 2026</p>
      <p>
        CrowdPilot is a hackathon preview. This policy covers exactly what the
        preview collects. Short on purpose.
      </p>
      <h2>What we collect</h2>
      <p>
        Your email (for sign-in codes), your workspace details (business name,
        goal, niche), and audience taste insights computed from public signals
        via Qloo. If you connect social accounts, we read audience signals like
        follows and engagement, never your DMs or private content.
      </p>
      <h2>What we don't do</h2>
      <p>
        No ads, no selling data, no tracking you across other sites. Nothing is
        posted to your accounts without your explicit approval.
      </p>
      <h2>Where data lives</h2>
      <p>
        Your workspace and audience profile are stored on our server tied to
        your account, so you can sign in from any device. Delete requests: email
        us and we'll wipe the account.
      </p>
      <h2>Third parties</h2>
      <p>
        Qloo (taste analysis), our publishing partner Onscript (social account
        connections and posting), and your email provider for sign-in codes.
        They process data only to make those features work.
      </p>
    </Legal>
  )
})
