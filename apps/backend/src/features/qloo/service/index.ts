import { Effect, Layer } from 'effect'
import { AppConfig } from '@/features/config'
import { QlooService } from './interface'
import { QlooServiceLive } from './live'
import { QlooServiceMockLive } from './mock'

export const isQlooPlaceholderKey = (apiKey: string) =>
  apiKey.length === 0 || apiKey === 'dev-placeholder'

export const shouldUseQlooMock = (config: { mock: boolean; apiKey: string }) =>
  config.mock || isQlooPlaceholderKey(config.apiKey)

export const QlooServiceAutoLive = Layer.unwrapEffect(
  Effect.map(AppConfig, (config) =>
    shouldUseQlooMock(config.qloo) ? QlooServiceMockLive : QlooServiceLive
  )
)

export { QlooService } from './interface'
export type {
  QlooEntity,
  QlooEntityType,
  QlooInsightsArgs,
  QlooInsightsResult,
  QlooProfileCard,
  QlooShape,
  QlooTag
} from './interface'
export { QlooNotFoundError, QlooServiceError } from './error'
export { QlooServiceLive } from './live'
export { QlooServiceMockLive } from './mock'
