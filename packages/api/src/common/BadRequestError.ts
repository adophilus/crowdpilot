import { HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

class BadRequestError extends Schema.TaggedError<BadRequestError>()(
  'BadRequestError',
  { message: Schema.optional(Schema.String) },
  HttpApiSchema.annotations({ status: 400 })
) {}

export default BadRequestError
