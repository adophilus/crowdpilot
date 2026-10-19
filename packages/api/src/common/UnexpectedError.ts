import { HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

class UnexpectedError extends Schema.TaggedError<UnexpectedError>()(
  'UnexpectedError',
  { message: Schema.optional(Schema.String) },
  HttpApiSchema.annotations({ status: 500 })
) {}

export default UnexpectedError
