import { HttpApiBuilder } from '@effect/platform'
import { Effect, Option } from 'effect'
import { Api } from '@crowdpilot/api'
import NotFoundError from '@crowdpilot/api/common/NotFoundError'
import UnexpectedError from '@crowdpilot/api/common/UnexpectedError'
import { EvidenceSuccess } from '@crowdpilot/api/Qloo/EvidenceEndpoint'
import { ProfileSuccess } from '@crowdpilot/api/Qloo/ProfileEndpoint'
import { EvidenceStore } from '@/features/evidence'
import { QlooService } from '../service'

export const QlooApiLive = HttpApiBuilder.group(Api, 'Qloo', (handlers) =>
  Effect.gen(function* () {
    const qloo = yield* QlooService
    const evidence = yield* EvidenceStore

    return handlers
      .handle('qlooProfile', ({ payload }) =>
        qloo.buildProfile(payload.entityIds, payload.tagIds).pipe(
          Effect.map((profile) =>
            ProfileSuccess.make({
              topTags: [...profile.topTags],
              affinities: profile.affinities.map((affinity) => ({
                domain: affinity.domain,
                picks: [...affinity.picks]
              })),
              evidenceRefs: [...profile.evidenceRefs]
            })
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
