import { HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  'NotFoundError',
  { message: Schema.optional(Schema.String) },
  HttpApiSchema.annotations({ status: 404 })
) {}

export default NotFoundError
