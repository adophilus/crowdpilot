import { HttpApiBuilder, HttpServerRequest } from '@effect/platform'
import { Effect, Option } from 'effect'
import { Api } from '@crowdpilot/api'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import {
  DemoRateLimitedError,
  DemoSessionSuccess
} from '@crowdpilot/api/Demo/DemoSessionEndpoint'
import { Sql } from '@crowdpilot/sql'
import { Auth, SESSION_TTL_SECONDS } from '../../auth'

const DEMO_EMAIL = 'demo@crowdpilot.local'
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

// ponytail: in-memory fixed-window limiter, per-process — just enough that a
// curious judge can't hammer the endpoint; swap for a shared bucket if this
// ever runs multi-instance.
const hits = new Map<string, { count: number; windowStart: number }>()

const allow = (ip: string) => {
  const now = Date.now()
  if (hits.size > 500) {
    for (const [key, entry] of hits) {
      if (entry.windowStart + RATE_WINDOW_MS < now) hits.delete(key)
    }
  }
  const entry = hits.get(ip)
  if (!entry || entry.windowStart + RATE_WINDOW_MS < now) {
    hits.set(ip, { count: 1, windowStart: now })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_LIMIT
}

export const DemoApiLive = HttpApiBuilder.group(Api, 'Demo', (handlers) =>
  Effect.gen(function* () {
    const auth = yield* Auth
    const sql = yield* Sql

    return handlers.handle('createDemoSession', () =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const ip = Option.getOrElse(request.remoteAddress, () => 'unknown')
        if (!allow(ip)) {
          return yield* Effect.fail(new DemoRateLimitedError())
        }

        // Same upsert the seed script does — created on demand so the demo
        // works on a fresh database without running the seed first.
        const user = yield* Effect.tryPromise({
          try: () =>
            sql
              .insertInto('users')
              .values({ email: DEMO_EMAIL, taste_profile: null })
              .onConflict((oc) =>
                oc.column('email').doUpdateSet({ email: DEMO_EMAIL })
              )
              .returningAll()
              .executeTakeFirstOrThrow(),
          catch: () => new UnexpectedError()
        })

        const { token } = yield* auth.createSessionForUser(user.id)

        return DemoSessionSuccess.make({ token, expiresIn: SESSION_TTL_SECONDS })
      }).pipe(
        Effect.catchTags({
          AuthEmailError: () => Effect.fail(new UnexpectedError())
        })
      )
    )
  })
)
