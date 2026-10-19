import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts
} from '@tanstack/react-router'
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/fraunces/opsz-italic.css'
import '@fontsource-variable/instrument-sans/index.css'
import './styles.css'

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23201812'/%3E%3Ctext x='16' y='23' font-size='19' text-anchor='middle' fill='%23d96b3f'%3E%E2%9C%B3%3C/text%3E%3C/svg%3E"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'CrowdPilot — know your crowd, ship the post' },
      {
        name: 'description',
        content:
          'A cultural co-pilot for independent cafés, bars and boutiques. Grounded in Qloo, published in one click.'
      },
      { name: 'theme-color', content: '#201812' },
      { rel: 'icon', href: FAVICON }
    ],
    links: [],
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
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
