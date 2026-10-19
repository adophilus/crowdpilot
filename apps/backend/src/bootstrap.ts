import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer, Logger, LogLevel } from 'effect'
import { createServer } from 'node:http'
import { Api } from '@crowdpilot/api'
import { DatabaseUrl, SqlLive } from '@crowdpilot/sql'
import { AppConfig } from './features/config'
import { AuthApiLive, SessionMiddlewareLive } from './features/auth'
import { AuthLive } from './features/auth'
import { SystemApiLive } from './features/system/route'

// Consumers merged before providers (Layer.provideMerge ordering rule).
export const AuthDepLayer = Layer.empty.pipe(
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(SqlLive),
  Layer.provideMerge(
    Layer.effect(DatabaseUrl, Effect.map(AppConfig, (c) => c.database.url))
  )
)

export const ApiEndpointLayer = AuthApiLive.pipe(
  Layer.provideMerge(SystemApiLive)
)

export const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(ApiEndpointLayer),
  Layer.provide(SessionMiddlewareLive),
  Layer.provide(AuthDepLayer)
)

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
