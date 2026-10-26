import { HttpApiBuilder } from '@effect/platform'
import { Effect, Option } from 'effect'
import { Api } from '@crowdpilot/api'
import NotFoundError from '@crowdpilot/api/common/NotFoundError'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import { EvidenceSuccess } from '@crowdpilot/api/Qloo/EvidenceEndpoint'
import { ProfileSuccess } from '@crowdpilot/api/Qloo/ProfileEndpoint'
import { EvidenceStore } from '@/features/evidence'
import { Sql } from '@crowdpilot/sql'
import { QlooService } from '../service'

export const QlooApiLive = HttpApiBuilder.group(Api, 'Qloo', (handlers) =>
  Effect.gen(function* () {
    const qloo = yield* QlooService
    const evidence = yield* EvidenceStore
    const sql = yield* Sql

    return handlers
      .handle('qlooProfile', ({ payload }) =>
        qloo.buildProfile(payload.entityIds, payload.tagIds).pipe(
          Effect.map((profile) => {
            const card = {
              topTags: [...profile.topTags],
              affinities: profile.affinities.map((affinity) => ({
                domain: affinity.domain,
                picks: [...affinity.picks]
              })),
              readAt: new Date().toISOString()
            }
            return { profile, card }
          }),
          // Persist the read on the user row — taste_profile was always
          // null before this; the dashboard rebuilds from it cross-device.
          Effect.flatMap(({ profile, card }) =>
            Effect.flatMap(CurrentUser, (user) =>
              Effect.flatMap(
                Effect.tryPromise({
                  try: () =>
                    sql
                      .updateTable('users')
                      .set({ taste_profile: card })
                      .where('id', '=', user.id)
                      .execute(),
                  catch: (cause) => new Error(String(cause))
                }).pipe(Effect.catchAll(() => Effect.void)),
                () =>
                  Effect.succeed(
                    ProfileSuccess.make({
                      topTags: card.topTags,
                      affinities: card.affinities,
                      evidenceRefs: [...profile.evidenceRefs]
                    })
                  )
              )
            )
          ),
          Effect.catchTags({
            QlooNotFoundError: (error) =>
              Effect.fail(
                new NotFoundError({
                  message: error.entityId
                    ? `Unknown Qloo entity: ${error.entityId}`
                    : `Unknown Qloo query: ${error.query ?? 'unknown'}`
                })
              ),
            QlooServiceError: () =>
              Effect.fail(
                new UnexpectedError({ message: 'Qloo request failed' })
              )
          })
        )
      )
      .handle('qlooEvidence', ({ path }) =>
        Effect.flatMap(evidence.get(path.refId), (entry) =>
          Option.isSome(entry)
            ? Effect.succeed(
                EvidenceSuccess.make({
                  refId: entry.value.refId,
                  request: entry.value.request,
                  response: entry.value.response,
                  timestamp: entry.value.timestamp
                })
              )
            : Effect.fail(
                new NotFoundError({
                  message: `No evidence entry for ${path.refId}`
                })
              )
        )
      )
  })
)
