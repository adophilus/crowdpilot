import { HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

// Mirrors Onscript's 402 PlanLimitExceededError; limitType is one of
// 'post' | 'platform' | 'accounts_per_platform'.
class PlanLimitError extends Schema.TaggedError<PlanLimitError>()(
  'PlanLimitError',
  {
    message: Schema.optional(Schema.String),
    limitType: Schema.optional(Schema.String)
  },
  HttpApiSchema.annotations({ status: 402 })
) {}

export default PlanLimitError
