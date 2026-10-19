import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from './SessionMiddleware'
import UnexpectedError from '../common/UnexpectedError'

export class LogoutSuccess extends Schema.TaggedClass<LogoutSuccess>()(
  'LogoutSuccess',
  {
    ok: Schema.Literal(true)
  }
) {}

const LogoutEndpoint = HttpApiEndpoint.post('logout', '/auth/logout')
  .addSuccess(LogoutSuccess)
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(OpenApi.Description, 'Revokes the current session.')

export default LogoutEndpoint
