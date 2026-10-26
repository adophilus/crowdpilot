import { HttpApiEndpoint, HttpApiSchema, OpenApi } from '@effect/platform'
import { Schema } from 'effect'

// Browser-facing redirect (302 to Google's consent screen) — not consumed by
// the typed client; declared for OpenAPI documentation only. Implemented with
// handleRaw in the backend route layer.
const GoogleStartEndpoint = HttpApiEndpoint.get(
  'googleStart',
  '/auth/google/start'
)
  .addSuccess(HttpApiSchema.Empty(302))
  .annotate(
    OpenApi.Description,
    'Starts the Google sign-in flow: 302 redirect to the Google consent screen with a signed one-time state.'
  )

export default GoogleStartEndpoint
