import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer, Logger, LogLevel } from 'effect'
import { createServer } from 'node:http'
import { Api } from '@crowdpilot/api'
import { AppConfig } from './features/config'
import { SystemApiLive } from './features/system/route'

export const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(SystemApiLive))

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(
    Layer.unwrapEffect(
      Effect.gen(function* () {
        const config = yield* AppConfig
        return NodeHttpServer.layer(createServer, { port: config.server.port })
      })
    )
  )
)

export const LoggerLive = Layer.empty.pipe(
  Layer.provideMerge(Logger.pretty),
  Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Debug))
)
