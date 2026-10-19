import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createFetchClient } from '@crowdpilot/api-client'

const api = createFetchClient(
  import.meta.env.VITE_API_URL ?? 'http://localhost:1050'
)

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'down'>('checking')

  useEffect(() => {
    api
      .GET('/health')
      .then(({ data }) => setStatus(data?.status === 'ok' ? 'ok' : 'down'))
      .catch(() => setStatus('down'))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>CrowdPilot</h1>
      <p>Qloo-powered business co-pilot — decides, creates, ships.</p>
      <p>
        Backend <code>GET /health</code>:{' '}
        <strong>
          {status === 'checking'
            ? 'checking…'
            : status === 'ok'
              ? '✅ up'
              : '❌ down'}
        </strong>
      </p>
    </main>
  )
}
