import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import UnexpectedError from '../common/UnexpectedError'

export class RequestCodePayload extends Schema.Class<RequestCodePayload>(
  'RequestCodePayload'
)({
  email: Schema.String
}) {}

export class RequestCodeSuccess extends Schema.TaggedClass<RequestCodeSuccess>()(
  'RequestCodeSuccess',
  {
    ok: Schema.Literal(true)
  }
) {}

const RequestCodeEndpoint = HttpApiEndpoint.post(
  'requestCode',
  '/auth/request-code'
)
  .setPayload(RequestCodePayload)
  .addSuccess(RequestCodeSuccess)
  .addError(UnexpectedError, { status: 500 })
  .annotate(
    OpenApi.Description,
    'Emails a 6-digit sign-in code. The code is valid for 10 minutes.'
  )

export default RequestCodeEndpoint
