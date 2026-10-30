import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer, Logger, LogLevel } from 'effect'
import { createServer } from 'node:http'
import { Api } from '@crowdpilot/api'
import { DatabaseUrl, SqlLive } from '@crowdpilot/sql'
import { AppConfig } from './features/config'
import { AuthApiLive, SessionMiddlewareLive } from './features/auth'
import { AuthLive } from './features/auth'
import { DemoApiLive } from './features/demo'
import { DirectionsApiLive } from './features/directions/route'
import { NichesApiLive } from './features/niches/route'
import { SystemApiLive } from './features/system/route'
import { AgentApiLive, AgentServiceLive } from './features/agent'
import { LlmServiceLive } from './features/llm'
import { OnscriptServiceLive } from './features/onscript'
import { OnscriptApiLive } from './features/onscript/api'
import { PostApiLive } from './features/post'
import { QlooApiLive, QlooServiceAutoLive } from './features/qloo'
import { WorkspaceApiLive } from './features/workspace'
import { EvidenceStoreLive } from './features/evidence'

// Consumers merged before providers (Layer.provideMerge ordering rule).
export const AuthDepLayer = Layer.empty.pipe(
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(SqlLive),
  Layer.provideMerge(
    Layer.effect(DatabaseUrl, Effect.map(AppConfig, (c) => c.database.url))
  )
)

export const QlooDepLayer = Layer.empty.pipe(
  Layer.provideMerge(QlooServiceAutoLive),
  Layer.provideMerge(EvidenceStoreLive)
)

export const AgentDepLayer = Layer.empty.pipe(
  Layer.provideMerge(AgentServiceLive),
  Layer.provideMerge(LlmServiceLive),
  Layer.provideMerge(OnscriptServiceLive),
  Layer.provideMerge(QlooDepLayer)
)

export const ApiEndpointLayer = AuthApiLive.pipe(
  Layer.provideMerge(SystemApiLive),
  Layer.provideMerge(QlooApiLive),
  Layer.provideMerge(AgentApiLive),
  Layer.provideMerge(DemoApiLive),
  Layer.provideMerge(OnscriptApiLive),
  Layer.provideMerge(PostApiLive),
  Layer.provideMerge(WorkspaceApiLive),
  Layer.provideMerge(DirectionsApiLive),
  Layer.provideMerge(NichesApiLive)
)

export const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(ApiEndpointLayer),
  Layer.provide(SessionMiddlewareLive),
  Layer.provide(AuthDepLayer),
  Layer.provide(AgentDepLayer)
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
