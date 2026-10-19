import { createHash } from 'node:crypto'
import { Effect, Layer, Redacted } from 'effect'
import SessionMiddleware from '@crowdpilot/api/Auth/SessionMiddleware'
import UnauthorizedError from '@crowdpilot/api/common/UnauthorizedError'
import { Sql } from '@crowdpilot/sql'

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

export const SessionMiddlewareLive = Layer.effect(
  SessionMiddleware,
  Effect.gen(function* () {
    const sql = yield* Sql

    return SessionMiddleware.of({
      token: (token) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise({
            try: () =>
              sql
                .selectFrom('sessions')
                .innerJoin('users', 'users.id', 'sessions.user_id')
                .where('sessions.token_hash', '=', sha256(Redacted.value(token)))
                .where('sessions.expires_at', '>', new Date())
                .select(['users.id', 'users.email'])
                .executeTakeFirstOrThrow(),
            catch: () => new UnauthorizedError()
          })

          return { id: row.id, email: row.email }
        })
    })
  })
)
