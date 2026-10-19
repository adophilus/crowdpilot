import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from './SessionMiddleware'

export class MeSuccess extends Schema.TaggedClass<MeSuccess>()('MeSuccess', {
  user: Schema.Struct({
    id: Schema.String,
    email: Schema.String
  })
}) {}

const MeEndpoint = HttpApiEndpoint.get('me', '/auth/me')
  .addSuccess(MeSuccess)
  .middleware(SessionMiddleware)
  .annotate(OpenApi.Description, 'Returns the signed-in user.')

export default MeEndpoint
