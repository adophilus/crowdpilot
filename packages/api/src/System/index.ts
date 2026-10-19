import { HttpApiGroup } from '@effect/platform'
import HealthCheckEndpoint from './HealthCheckEndpoint'

const SystemApi = HttpApiGroup.make('System').add(HealthCheckEndpoint)

export default SystemApi
