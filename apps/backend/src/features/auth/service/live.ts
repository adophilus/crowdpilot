import { createHash, randomBytes, randomInt } from 'node:crypto'
import { Effect, Layer } from 'effect'
import nodemailer from 'nodemailer'
import InvalidOrExpiredCodeError from '@crowdpilot/api/common/InvalidOrExpiredCodeError'
import { Sql } from '@crowdpilot/sql'
import { AppConfig } from '@/features/config'
import { Auth } from './interface'
import { AuthEmailError } from './error'

const CODE_TTL_MS = 10 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

export const AuthLive = Layer.effect(
  Auth,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const sql = yield* Sql

    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass }
    })

    // Ephemeral OTP codes — 10-minute TTL, losing them on restart is fine
    // (users just request a new code). Sessions are durable in Postgres.
    const codes = new Map<string, { hash: string; expiresAt: number }>()

    return Auth.of({
      requestCode: (email) =>
        Effect.gen(function* () {
          const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
          codes.set(email, {
            hash: sha256(code),
            expiresAt: Date.now() + CODE_TTL_MS
          })

          yield* Effect.tryPromise({
            try: () =>
              transporter.sendMail({
                from: config.smtp.user,
                to: email,
                subject: 'Your CrowdPilot code',
                text: `Your CrowdPilot code is ${code}. It expires in 10 minutes.`
              }),
            catch: (cause) => new AuthEmailError({ cause })
          })

          if (config.environment.isDevelopment) {
            yield* Effect.log(`[dev] OTP code for ${email}: ${code}`)
          }
        }),

      verify: (email, code) =>
        Effect.gen(function* () {
          const entry = codes.get(email)
          if (
            !entry ||
            entry.expiresAt < Date.now() ||
            entry.hash !== sha256(code)
          ) {
            return yield* Effect.fail(new InvalidOrExpiredCodeError())
          }
          codes.delete(email)

          const user = yield* Effect.tryPromise({
            try: () =>
              sql
                .insertInto('users')
                .values({ email, taste_profile: null })
                .onConflict((oc) =>
                  oc.column('email').doUpdateSet({ email: email })
                )
                .returningAll()
                .executeTakeFirstOrThrow(),
            catch: (cause) => new AuthEmailError({ cause })
          })

          const token = randomBytes(32).toString('hex')
          yield* Effect.tryPromise({
            try: () =>
              sql
                .insertInto('sessions')
                .values({
                  token_hash: sha256(token),
                  user_id: user.id,
                  expires_at: new Date(Date.now() + SESSION_TTL_MS)
                })
                .execute(),
            catch: (cause) => new AuthEmailError({ cause })
          })

          return { token, user: { id: user.id, email: user.email } }
        }),

      logout: (rawToken) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              sql
                .deleteFrom('sessions')
                .where('token_hash', '=', sha256(rawToken))
                .execute(),
            catch: (cause) => new AuthEmailError({ cause })
          })
        })
    })
  })
)
