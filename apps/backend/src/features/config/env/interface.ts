import { Context } from 'effect'
import type { EnvSchema } from './schema'

export class Env extends Context.Tag('Env')<Env, EnvSchema>() {}
