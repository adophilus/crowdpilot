import {
  HttpApiMiddleware,
  HttpApiSchema,
  HttpApiSecurity,
  OpenApi
} from '@effect/platform'
import { Schema } from 'effect'
import CurrentUser from '../common/CurrentUser'
import UnauthorizedError from '../common/UnauthorizedError'

class SessionMiddleware extends HttpApiMiddleware.Tag<SessionMiddleware>()(
  'SessionMiddleware',
  {
    provides: CurrentUser,
    failure: UnauthorizedError.pipe(
      Schema.annotations(HttpApiSchema.annotations({ status: 401 }))
    ),
    security: {
      token: HttpApiSecurity.bearer.pipe(
        HttpApiSecurity.annotate(
          OpenApi.Description,
          'Session bearer token from POST /auth/verify'
        )
      )
    }
  }
) {}

export default SessionMiddleware
