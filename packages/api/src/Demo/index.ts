import { HttpApiGroup } from '@effect/platform'
import DemoSessionEndpoint from './DemoSessionEndpoint'

const DemoApi = HttpApiGroup.make('Demo').add(DemoSessionEndpoint)

export default DemoApi
