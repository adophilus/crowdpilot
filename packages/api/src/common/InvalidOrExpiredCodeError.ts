import { HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

class InvalidOrExpiredCodeError extends Schema.TaggedError<InvalidOrExpiredCodeError>()(
  'InvalidOrExpiredCodeError',
  {},
  HttpApiSchema.annotations({ status: 400 })
) {}

export default InvalidOrExpiredCodeError
