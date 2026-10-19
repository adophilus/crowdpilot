import { Context, Effect, Layer } from 'effect'
import type { Kysely } from 'kysely'
import { createKysely } from './db'
import type { Database } from './types'

export class DatabaseUrl extends Context.Tag('DatabaseUrl')<
  DatabaseUrl,
  string
>() {}

export class Sql extends Context.Tag('Sql')<Sql, Kysely<Database>>() {}

export const SqlLive = Layer.effect(Sql, Effect.map(DatabaseUrl, createKysely))

export { createKysely }
export type { Database } from './types'
