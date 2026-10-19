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

export const QlooConfigSchema = Schema.Struct({
  apiKey: Schema.String,
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

export const AppConfigSchema = Schema.Class<AppConfigSchema>('AppConfigSchema')(
  {
    environment: EnvironmentConfigSchema,
    server: ServerConfigSchema,
    qloo: QlooConfigSchema,
    onscript: OnscriptConfigSchema,
    ownerToken: Schema.String,
    llm: LlmConfigSchema
  }
)
