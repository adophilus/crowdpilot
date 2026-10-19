import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import { HealthCheckResponse } from '@crowdpilot/api/System/HealthCheckEndpoint'

export const SystemApiLive = HttpApiBuilder.group(
  Api,
  'System',
  (handlers) =>
    handlers.handle('healthCheck', () =>
      Effect.succeed(HealthCheckResponse.make({ status: 'ok' }))
    )
)
