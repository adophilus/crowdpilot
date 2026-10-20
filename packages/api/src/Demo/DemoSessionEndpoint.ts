import { HttpApiEndpoint, HttpApiSchema, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import UnexpectedError from '../common/UnexpectedError'

export class DemoRateLimitedError extends Schema.TaggedError<DemoRateLimitedError>()(
  'DemoRateLimitedError',
  {},
  HttpApiSchema.annotations({ status: 429 })
) {}

export class DemoSessionSuccess extends Schema.TaggedClass<DemoSessionSuccess>()(
  'DemoSessionSuccess',
  {
    token: Schema.String,
    expiresIn: Schema.Number
  }
) {}

const DemoSessionEndpoint = HttpApiEndpoint.post(
  'createDemoSession',
  '/demo/session'
)
  .addSuccess(DemoSessionSuccess)
  .addError(DemoRateLimitedError, { status: 429 })
  .addError(UnexpectedError, { status: 500 })
  .annotate(
    OpenApi.Description,
    'Creates a session for the seeded demo user (demo@crowdpilot.local) — no signup. Rate-limited to 10 requests per IP per hour. expiresIn is the token lifetime in seconds (30 days).'
  )

export default DemoSessionEndpoint
