import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts
} from '@tanstack/react-router'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/geist/index.css'
import '@fontsource-variable/geist-mono/index.css'
import '../styles.css'

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='17' fill='none' stroke='%23141414' stroke-width='3.5'/%3E%3Cpath d='M33.5 14.5L27 27L21 21Z' fill='%23E5532A'/%3E%3Cpath d='M14.5 33.5L21 21L27 27Z' fill='%23141414'/%3E%3C/svg%3E"

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'CrowdPilot' },
      {
        name: 'description',
        content:
          'Your audience, read by Qloo. CrowdPilot finds what your crowd loves and turns it into plans and posts.'
      },
      { name: 'theme-color', content: '#FAFAF8' }
    ],
    links: [{ rel: 'icon', href: FAVICON }],
    scripts: []
  }),
  component: RootComponent
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
