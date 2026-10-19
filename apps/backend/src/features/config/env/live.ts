import { Config, Effect, Layer, Option, Schema } from 'effect'
import { Env } from './interface'
import { EnvSchema } from './schema'

export const EnvLive = Layer.effect(
  Env,
  Effect.gen(function* () {
    const rawConfig = {
      NODE_ENV: yield* Config.string('NODE_ENV').pipe(
        Config.withDefault('development')
      ),
      PORT: yield* Config.number('PORT').pipe(Config.withDefault(1050)),
      DATABASE_URL: yield* Config.string('DATABASE_URL'),
      SMTP_HOST: yield* Config.string('SMTP_HOST'),
      SMTP_PORT: yield* Config.number('SMTP_PORT').pipe(
        Config.withDefault(587)
      ),
      SMTP_USER: yield* Config.string('SMTP_USER'),
      SMTP_PASS: yield* Config.string('SMTP_PASS'),
      QLOO_API_KEY: yield* Config.string('QLOO_API_KEY'),
      QLOO_MOCK: yield* Config.boolean('QLOO_MOCK').pipe(
        Config.withDefault(true)
      ),
      QLOO_BASE_URL: yield* Config.string('QLOO_BASE_URL').pipe(
        Config.withDefault('https://hackathon.api.qloo.com')
      ),
      ONSCRIPT_BASE_URL: yield* Config.string('ONSCRIPT_BASE_URL'),
      ONSCRIPT_SESSION_TOKEN: yield* Config.string('ONSCRIPT_SESSION_TOKEN'),
      LLM_API_KEY: yield* Config.string('LLM_API_KEY'),
      LLM_BASE_URL: yield* Config.option(Config.string('LLM_BASE_URL')).pipe(
        Config.map(Option.getOrUndefined)
      ),
      LLM_MODEL: yield* Config.option(Config.string('LLM_MODEL')).pipe(
        Config.map(Option.getOrUndefined)
      )
    }

    return yield* Schema.decodeUnknown(EnvSchema)(rawConfig)
  })
)
