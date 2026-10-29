import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import NotFoundError from '@crowdpilot/api/common/NotFoundError'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import {
  GenerateDirectionsSuccess,
  GeneratedDirection
} from '@crowdpilot/api/Directions/index'
import { Sql } from '@crowdpilot/sql'
import { LlmService } from '../../llm'

const VALID_FILLS = [100, 60, 35] as const
const VALID_GOALS = ['break', 'deep', 'niche'] as const

type PlainDirection = {
  id: string
  goal: 'break' | 'deep' | 'niche'
  kind: string
  fill: 100 | 60 | 35
  title: string
  summary: string
  receipts: string[]
}

const nearestFill = (n: number): 100 | 60 | 35 =>
  VALID_FILLS.reduce((best, f) =>
    Math.abs(f - n) < Math.abs(best - n) ? f : best
  ) as 100 | 60 | 35

const kebab = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'direction'

// Turns the LLM's raw JSON text into plain direction objects, or null when
// nothing salvageable came back. Plain, not Schema instances: jsonb columns
// stringify Schema instances as {}.
const normalizeDirections = (
  raw: string,
  goalHint: string | undefined
): PlainDirection[] | null => {
  try {
    const withoutFences = raw.replace(/```(?:json)?/g, '')
    const start = withoutFences.indexOf('{')
    const end = withoutFences.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    const parsed = JSON.parse(withoutFences.slice(start, end + 1)) as {
      directions?: unknown
    }
    const list = Array.isArray(parsed.directions) ? parsed.directions : null
    if (!list) return null

    const seen = new Set<string>()
    const out: PlainDirection[] = []
    for (const item of list.slice(0, 6)) {
      if (!item || typeof item !== 'object') continue
      const rec = item as Record<string, unknown>
      const title = typeof rec.title === 'string' ? rec.title.trim() : ''
      const summary = typeof rec.summary === 'string' ? rec.summary.trim() : ''
      if (!title || !summary) continue
      const goal = (VALID_GOALS as readonly string[]).includes(
        String(rec.goal)
      )
        ? (String(rec.goal) as PlainDirection['goal'])
        : (goalHint as PlainDirection['goal'] | undefined) ?? 'deep'
      let id = kebab(typeof rec.id === 'string' && rec.id ? rec.id : title)
      while (seen.has(id)) id = `${id}-x`
      seen.add(id)
      const receipts = Array.isArray(rec.receipts)
        ? rec.receipts
            .filter((r): r is string => typeof r === 'string')
            .slice(0, 2)
        : []
      out.push({
        id,
        goal,
        kind: typeof rec.kind === 'string' && rec.kind ? rec.kind : 'Go deeper',
        fill: nearestFill(Number(rec.fill) || 60),
        title,
        summary,
        receipts
      })
    }
    return out.length >= 2 ? out : null
  } catch {
    return null
  }
}

export const DirectionsApiLive = HttpApiBuilder.group(
  Api,
  'Directions',
  (handlers) =>
    Effect.gen(function* () {
      const sql = yield* Sql
      const llm = yield* LlmService

      return handlers.handle('generateDirections', () =>
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
          const profile = (row?.taste_profile ?? null) as {
            topTags?: Array<{ tag?: string; score?: number }>
            affinities?: Array<{
              domain?: string
              picks?: Array<{ name?: string; score?: number }>
            }>
          } | null
          if (!profile?.topTags?.length) {
            return yield* Effect.fail(
              new NotFoundError({ message: 'Run the audience read first' })
            )
          }
          const ws = (row?.workspace ?? {}) as {
            goal?: string
            niche?: string
            business?: { type?: string }
          }

          const system =
            'You convert Qloo taste profiles into growth directions for a small business. ' +
            'Output ONLY valid JSON, no code fences, no prose: ' +
            '{"directions":[{"id":"kebab-case-id","goal":"break or deep or niche","kind":"short label like Go deeper or Find new niches","fill":100,"title":"max 6 words","summary":"1-2 sentences for this business","receipts":["1-2 exact tag names copied from the profile"]}]} ' +
            'Exactly 4 directions, at least one per goal category the profile supports. ' +
            'fill is 100, 60 or 35 and reflects how strongly the profile supports the direction. ' +
            'Copy tag names into receipts EXACTLY as they appear in the profile.'
          const userMsg = JSON.stringify({
            profile: {
              topTags: profile.topTags,
              affinities: profile.affinities
            },
            goal: ws.goal ?? null,
            niche: ws.niche ?? null,
            businessType: ws.business?.type ?? null
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
          const directions = normalizeDirections(
            result.message.content ?? '',
            typeof ws.goal === 'string' ? ws.goal : undefined
          )
          if (!directions) {
            return yield* Effect.fail(
              new UnexpectedError({
                message: 'LLM returned unparsable directions'
              })
            )
          }
          yield* Effect.tryPromise({
            try: () =>
              sql
                .updateTable('users')
                .set({
                  workspace: {
                    ...(typeof row?.workspace === 'object' &&
                    row.workspace !== null
                      ? (row.workspace as Record<string, unknown>)
                      : {}),
                    directions
                  }
                })
                .where('id', '=', user.id)
                .execute(),
            catch: (cause) => new UnexpectedError({ message: String(cause) })
          })
          return GenerateDirectionsSuccess.make({
            directions: [...directions]
          })
        })
      )
  })
)
