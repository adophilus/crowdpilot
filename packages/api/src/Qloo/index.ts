import { HttpApiGroup } from '@effect/platform'
import EvidenceEndpoint from './EvidenceEndpoint'
import ProfileEndpoint from './ProfileEndpoint'

const QlooApi = HttpApiGroup.make('Qloo')
  .add(ProfileEndpoint)
  .add(EvidenceEndpoint)

export default QlooApi
