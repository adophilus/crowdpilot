import { Effect, Layer, Schema } from 'effect'
import { Env } from '../env'
import { AppConfig } from './interface'
import { AppConfigSchema } from './schema'

export const AppConfigLive = Layer.effect(
  AppConfig,
  Effect.gen(function* () {
    const env = yield* Env

    return yield* Schema.decodeUnknown(AppConfigSchema)({
      environment: {
        isProduction: env.NODE_ENV === 'production',
        isStaging: env.NODE_ENV === 'staging',
        isDevelopment: env.NODE_ENV === 'development',
        isTesting: env.NODE_ENV === 'test'
      },
      server: {
        port: env.PORT
      },
      qloo: {
        apiKey: env.QLOO_API_KEY,
        baseUrl: env.QLOO_BASE_URL
      },
      onscript: {
        baseUrl: env.ONSCRIPT_BASE_URL,
        sessionToken: env.ONSCRIPT_SESSION_TOKEN
      },
      ownerToken: env.OWNER_TOKEN,
      llm: {
        apiKey: env.LLM_API_KEY,
        baseUrl: env.LLM_BASE_URL
      }
    })
  })
)
