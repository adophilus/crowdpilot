import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import InvalidOrExpiredCodeError from '../common/InvalidOrExpiredCodeError'
import UnexpectedError from '../common/UnexpectedError'

export class VerifyPayload extends Schema.Class<VerifyPayload>('VerifyPayload')(
  {
    email: Schema.String,
    code: Schema.String.pipe(Schema.pattern(/^\d{6}$/))
  }
) {}

export class VerifySuccess extends Schema.TaggedClass<VerifySuccess>()(
  'VerifySuccess',
  {
    token: Schema.String,
    user: Schema.Struct({
      id: Schema.String,
      email: Schema.String
    })
  }
) {}

const VerifyEndpoint = HttpApiEndpoint.post('verify', '/auth/verify')
  .setPayload(VerifyPayload)
  .addSuccess(VerifySuccess)
  .addError(InvalidOrExpiredCodeError, { status: 400 })
  .addError(UnexpectedError, { status: 500 })
  .annotate(
    OpenApi.Description,
    'Exchanges a 6-digit code for a session bearer token (30-day expiry).'
  )

export default VerifyEndpoint
