import { HttpApiEndpoint, HttpApiSchema, OpenApi } from '@effect/platform'
import { Schema } from 'effect'

// Browser-facing redirect (302 back to the web app with the session token in
// the URL fragment) — not consumed by the typed client; declared for OpenAPI
// documentation only. Implemented with handleRaw in the backend route layer.
const GoogleCallbackEndpoint = HttpApiEndpoint.get(
  'googleCallback',
  '/auth/google/callback'
)
  .setUrlParams(
    Schema.Struct({
      code: Schema.String,
      state: Schema.String
    })
  )
  .addSuccess(HttpApiSchema.Empty(302))
  .annotate(
    OpenApi.Description,
    'Google OAuth redirect target: validates state, exchanges the code for a profile, find-or-creates the user, mints a session and 302s to the web app with the token in the fragment.'
  )

export default GoogleCallbackEndpoint
