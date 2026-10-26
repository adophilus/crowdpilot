import { createRouter } from '@tanstack/react-router'
import { tanstackQueryClient } from './lib/api'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({ routeTree, context: { queryClient: tanstackQueryClient } })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
