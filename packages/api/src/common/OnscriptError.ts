import { HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

class OnscriptError extends Schema.TaggedError<OnscriptError>()(
  'OnscriptError',
  { message: Schema.optional(Schema.String) },
  HttpApiSchema.annotations({ status: 502 })
) {}

export default OnscriptError
