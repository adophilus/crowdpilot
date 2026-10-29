import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts
} from '@tanstack/react-router'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/geist/index.css'
import '@fontsource-variable/geist-mono/index.css'
import '@fontsource/caveat/600.css'
import '../styles.css'
import { FAVICON_HREF } from '../components/Logo'

const TITLE = 'CrowdPilot · Find your people'
const DESCRIPTION =
  'CrowdPilot reads the taste of the audience you have, and the one you want, grounded in Qloo’s taste graph, then shows you what to post, host or stock next.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#EFEFEB' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' }
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: FAVICON_HREF }]
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
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
