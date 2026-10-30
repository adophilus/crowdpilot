import {
  createHash,
  randomBytes,
  randomInt
} from 'node:crypto'
import { Effect, Layer } from 'effect'
import nodemailer from 'nodemailer'
import InvalidOrExpiredCodeError from '@crowdpilot/api/common/InvalidOrExpiredCodeError'
import { Sql } from '@crowdpilot/sql'
import { AppConfig } from '@/features/config'
import { Auth } from './interface'
import { AuthEmailError, GoogleAuthError } from './error'

const CODE_TTL_MS = 10 * 60 * 1000
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

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

    // One-time OAuth states, same TTL/disposability tradeoff as the OTP codes.
    const googleStates = new Map<string, number>()

    const createSessionForUser = (userId: string) =>
      Effect.gen(function* () {
        const token = randomBytes(32).toString('hex')
        yield* Effect.tryPromise({
          try: () =>
            sql
              .insertInto('sessions')
              .values({
                token_hash: sha256(token),
                user_id: userId,
                expires_at: new Date(Date.now() + SESSION_TTL_MS)
              })
              .execute(),
          catch: (cause) => new AuthEmailError({ cause })
        })
        return { token, expiresIn: SESSION_TTL_SECONDS }
      })

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

          const { token } = yield* createSessionForUser(user.id)

          return { token, user: { id: user.id, email: user.email } }
        }),

      createSessionForUser,

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
        }),

      googleStart: () =>
        Effect.sync(() => {
          for (const [nonce, expiresAt] of googleStates) {
            if (expiresAt < Date.now()) googleStates.delete(nonce)
          }

          const state = randomBytes(16).toString('hex')
          googleStates.set(state, Date.now() + CODE_TTL_MS)

          const url = new URL(GOOGLE_AUTH_URL)
          url.searchParams.set('client_id', config.googleOAuth.clientId)
          url.searchParams.set('redirect_uri', config.googleOAuth.redirectUri)
          url.searchParams.set('response_type', 'code')
          url.searchParams.set('scope', 'openid email profile')
          url.searchParams.set('state', state)
          return url.toString()
        }),

      googleSignIn: (code, state) =>
        Effect.gen(function* () {
          console.log('[debug] googleSignIn state lookup:', state, 'known:', [...googleStates.keys()])
          const expiresAt = googleStates.get(state)
          googleStates.delete(state) // single-use
          if (!expiresAt || expiresAt < Date.now()) {
            return yield* Effect.fail(
              new GoogleAuthError({ cause: 'invalid or expired state' })
            )
          }

          const tokens = yield* Effect.tryPromise({
            try: () =>
              fetch(GOOGLE_TOKEN_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  code,
                  client_id: config.googleOAuth.clientId,
                  client_secret: config.googleOAuth.clientSecret,
                  redirect_uri: config.googleOAuth.redirectUri,
                  grant_type: 'authorization_code'
                })
              }).then(async (res) => {
                if (!res.ok)
                  throw new Error(`token exchange failed: ${res.status}`)
                return (await res.json()) as { access_token: string }
              }),
            catch: (cause) => new GoogleAuthError({ cause })
          })

          const profile = yield* Effect.tryPromise({
            try: () =>
              fetch(GOOGLE_USERINFO_URL, {
                headers: { authorization: `Bearer ${tokens.access_token}` }
              }).then(async (res) => {
                if (!res.ok)
                  throw new Error(`userinfo failed: ${res.status}`)
                return (await res.json()) as {
                  email?: string
                  email_verified?: boolean
                  name?: string
                }
              }),
            catch: (cause) => new GoogleAuthError({ cause })
          })

          if (!profile.email || profile.email_verified === false) {
            return yield* Effect.fail(
              new GoogleAuthError({ cause: 'no verified email on Google account' })
            )
          }
          const email = profile.email

          const user = yield* Effect.tryPromise({
            try: () =>
              sql
                .insertInto('users')
                .values({ email, taste_profile: null })
                .onConflict((oc) =>
                  oc.column('email').doUpdateSet({ email })
                )
                .returningAll()
                .executeTakeFirstOrThrow(),
            catch: (cause) => new GoogleAuthError({ cause })
          })

          const { token } = yield* createSessionForUser(user.id)
          return { token, user: { id: user.id, email: user.email } }
        })
    })
  })
)
