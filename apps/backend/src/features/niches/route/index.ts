import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import NotFoundError from '@crowdpilot/api/common/NotFoundError'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import { GenerateNichesSuccess } from '@crowdpilot/api/Niches/index'
import { Sql } from '@crowdpilot/sql'
import { LlmService } from '../../llm'

type ProfileCard = {
  topTags?: Array<{ tag?: string; score?: number }>
  affinities?: Array<{
    domain?: string
    picks?: Array<{ name?: string; score?: number }>
  }>
}

const normalizeNiches = (raw: string): string[] | null => {
  try {
    const withoutFences = raw.replace(/```(?:json)?/g, '')
    const start = withoutFences.indexOf('{')
    const end = withoutFences.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    const parsed = JSON.parse(withoutFences.slice(start, end + 1)) as {
      niches?: unknown
    }
    const list = Array.isArray(parsed.niches) ? parsed.niches : null
    if (!list) return null
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of list.slice(0, 6)) {
      if (typeof item !== 'string') continue
      const name = item.trim().slice(0, 40)
      if (!name || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      out.push(name)
    }
    return out.length >= 3 ? out : null
  } catch {
    return null
  }
}

export const NichesApiLive = HttpApiBuilder.group(Api, 'Niches', (handlers) =>
  Effect.gen(function* () {
    const llm = yield* LlmService
    const sql = yield* Sql

    return handlers.handle('generateNiches', () =>
      Effect.gen(function* () {
        const user = yield* CurrentUser
        const row = yield* Effect.tryPromise({
          try: () =>
            sql
              .selectFrom('users')
              .where('id', '=', user.id)
              .select(['taste_profile', 'workspace'])
              .executeTakeFirst(),
          catch: (cause) => new UnexpectedError({ message: String(cause) })
        })
        const profile = (row?.taste_profile ?? null) as ProfileCard | null
        if (!profile?.topTags?.length) {
          return yield* Effect.fail(
            new NotFoundError({ message: 'Run the audience read first' })
          )
        }
        const ws = (row?.workspace ?? {}) as {
          goal?: string
          niche?: string
        }

        const system =
          'You analyze Qloo audience taste profiles for small businesses. ' +
          'Output ONLY valid JSON, no code fences, no prose: ' +
          '{"niches":["niche community name","..."]} ' +
          'Suggest 4 to 6 niche communities this audience could grow into. ' +
          'Each name: 2-5 words, specific and evocative, like "Afro-house nights" or "Vintage & thrift pop-ups". ' +
          'Derive them from the profile tags and affinity picks. No explanations.'
        const userMsg = JSON.stringify({
          profile: {
            topTags: profile.topTags,
            affinities: profile.affinities
          },
          goal: ws.goal ?? null,
          niche: ws.niche ?? null
        })

        const result = yield* llm
          .chat({
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: userMsg }
            ]
          })
          .pipe(
            Effect.mapError(
              (cause) => new UnexpectedError({ message: String(cause) })
            )
          )
        const niches = normalizeNiches(result.message.content ?? '')
        if (!niches) {
          return yield* Effect.fail(
            new UnexpectedError({
              message: 'LLM returned unparsable niches'
            })
          )
        }
        const existingWorkspace =
          typeof row?.workspace === 'object' && row.workspace !== null
            ? (row.workspace as Record<string, unknown>)
            : {}
        yield* Effect.tryPromise({
          try: () =>
            sql
              .updateTable('users')
              .set({
                workspace: { ...existingWorkspace, niches }
              })
              .where('id', '=', user.id)
              .execute(),
          catch: (cause) => new UnexpectedError({ message: String(cause) })
        })
        return GenerateNichesSuccess.make({ niches })
      })
    )
  })
)
