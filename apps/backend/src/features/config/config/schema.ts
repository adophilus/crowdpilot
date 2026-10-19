import { Schema } from 'effect'

export const EnvironmentConfigSchema = Schema.Struct({
  isProduction: Schema.Boolean,
  isStaging: Schema.Boolean,
  isDevelopment: Schema.Boolean,
  isTesting: Schema.Boolean
})

export const ServerConfigSchema = Schema.Struct({
  port: Schema.Number
})

export const DatabaseConfigSchema = Schema.Struct({
  url: Schema.String
})

export const SmtpConfigSchema = Schema.Struct({
  host: Schema.String,
  port: Schema.Number,
  user: Schema.String,
  pass: Schema.String
})

export const QlooConfigSchema = Schema.Struct({
  apiKey: Schema.String,
  mock: Schema.Boolean,
  baseUrl: Schema.String
})

export const OnscriptConfigSchema = Schema.Struct({
  baseUrl: Schema.String,
  sessionToken: Schema.String
})

export const LlmConfigSchema = Schema.Struct({
  apiKey: Schema.String,
  baseUrl: Schema.UndefinedOr(Schema.String)
})

export class AppConfigSchema extends Schema.Class<AppConfigSchema>(
  'AppConfigSchema'
)({
  environment: EnvironmentConfigSchema,
  server: ServerConfigSchema,
  database: DatabaseConfigSchema,
  smtp: SmtpConfigSchema,
  qloo: QlooConfigSchema,
  onscript: OnscriptConfigSchema,
  llm: LlmConfigSchema
}) {}
