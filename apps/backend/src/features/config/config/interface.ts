import { Context } from 'effect'
import type { AppConfigSchema } from './schema'

export class AppConfig extends Context.Tag('AppConfig')<
  AppConfig,
  AppConfigSchema
>() {}
