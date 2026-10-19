import { Schema } from 'effect'

export class EnvSchema extends Schema.Class<EnvSchema>('EnvSchema')({
  NODE_ENV: Schema.Literal('production', 'staging', 'development', 'test'),
  PORT: Schema.Number,
  QLOO_API_KEY: Schema.String,
  QLOO_BASE_URL: Schema.String,
  ONSCRIPT_BASE_URL: Schema.String,
  ONSCRIPT_SESSION_TOKEN: Schema.String,
  OWNER_TOKEN: Schema.String,
  LLM_API_KEY: Schema.String,
  LLM_BASE_URL: Schema.UndefinedOr(Schema.String)
}) {}
