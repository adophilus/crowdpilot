import { Schema } from 'effect'

export class EnvSchema extends Schema.Class<EnvSchema>('EnvSchema')({
  NODE_ENV: Schema.Literal('production', 'staging', 'development', 'test'),
  PORT: Schema.Number,
  DATABASE_URL: Schema.String,
  SMTP_HOST: Schema.String,
  SMTP_PORT: Schema.Number,
  SMTP_USER: Schema.String,
  SMTP_PASS: Schema.String,
  QLOO_API_KEY: Schema.String,
  QLOO_MOCK: Schema.Boolean,
  QLOO_BASE_URL: Schema.String,
  ONSCRIPT_BASE_URL: Schema.String,
  ONSCRIPT_SESSION_TOKEN: Schema.String,
  LLM_API_KEY: Schema.String,
  LLM_BASE_URL: Schema.UndefinedOr(Schema.String),
  LLM_MODEL: Schema.UndefinedOr(Schema.String),
  GOOGLE_OAUTH_CLIENT_ID: Schema.String,
  GOOGLE_OAUTH_CLIENT_SECRET: Schema.String,
  GOOGLE_OAUTH_REDIRECT_URI: Schema.String,
  AUTH_SUCCESS_REDIRECT: Schema.String
}) {}
