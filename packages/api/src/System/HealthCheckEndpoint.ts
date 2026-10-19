import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'

export class HealthCheckResponse extends Schema.TaggedClass<HealthCheckResponse>()(
  'HealthCheckResponse',
  {
    status: Schema.Literal('ok')
  }
) {}

const HealthCheckEndpoint = HttpApiEndpoint.get('healthCheck', '/health')
  .addSuccess(HealthCheckResponse)
  .annotate(
    OpenApi.Description,
    'Liveness probe — returns 200 OK when the server is up.'
  )

export default HealthCheckEndpoint
