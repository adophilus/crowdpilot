import { HttpApiGroup } from '@effect/platform'
import LogoutEndpoint from './LogoutEndpoint'
import MeEndpoint from './MeEndpoint'
import RequestCodeEndpoint from './RequestCodeEndpoint'
import VerifyEndpoint from './VerifyEndpoint'

const AuthApi = HttpApiGroup.make('Auth')
  .add(RequestCodeEndpoint)
  .add(VerifyEndpoint)
  .add(MeEndpoint)
  .add(LogoutEndpoint)

export default AuthApi
