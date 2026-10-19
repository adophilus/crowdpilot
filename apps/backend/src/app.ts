import { Layer } from 'effect'
import { HttpLive, LoggerLive } from './bootstrap'
import { AppConfigLive, EnvLive } from './features/config'

export const AppLive = HttpLive.pipe(
  Layer.provide(LoggerLive),
  Layer.provide(AppConfigLive),
  Layer.provide(EnvLive)
)
