import { createHash, randomBytes } from 'node:crypto'
import { Effect } from 'effect'
import { createKysely } from '@crowdpilot/sql'

// Seeds the demo persona used by the publish spike and the judge demo:
// pnpm --filter @crowdpilot/backend seed
// Prints a bearer token bound to demo@crowdpilot.local.

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

const program = Effect.gen(function* () {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const sql = createKysely(databaseUrl)

  const user = yield* Effect.tryPromise(() =>
    sql
      .insertInto('users')
      .values({ email: 'demo@crowdpilot.local', taste_profile: null })
      .onConflict((oc) => oc.column('email').doUpdateSet({ email: 'demo@crowdpilot.local' }))
      .returningAll()
      .executeTakeFirstOrThrow()
  )

  const token = randomBytes(32).toString('hex')
  yield* Effect.tryPromise(() =>
    sql
      .insertInto('sessions')
      .values({
        token_hash: sha256(token),
        user_id: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .execute()
  )

  yield* Effect.promise(() => sql.destroy())

  console.log(`seeded demo user: ${user.email} (${user.id})`)
  console.log(`session token: ${token}`)
})

Effect.runPromise(program).catch((err) => {
  console.error(err)
  process.exit(1)
})
