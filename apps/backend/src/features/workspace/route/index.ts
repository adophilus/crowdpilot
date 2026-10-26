import { HttpApiBuilder } from '@effect/platform'
import { Effect } from 'effect'
import { Api } from '@crowdpilot/api'
import CurrentUser from '@crowdpilot/api/common/CurrentUser'
import {
  WorkspaceGetSuccess,
  WorkspaceSavedSuccess
} from '@crowdpilot/api/Workspace/index'
import { Sql } from '@crowdpilot/sql'

export const WorkspaceApiLive = HttpApiBuilder.group(
  Api,
  'Workspace',
  (handlers) =>
    Effect.gen(function* () {
      const sql = yield* Sql

      return handlers
        .handle('getWorkspace', () =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.map(
              Effect.tryPromise({
                try: () =>
                  sql
                    .selectFrom('users')
                    .where('id', '=', user.id)
                    .select(['workspace'])
                    .executeTakeFirst(),
                // A DB failure here is a defect, not a client error — die
                // and let the framework answer 500.
                catch: (cause) => cause
              }).pipe(Effect.orDie),
              (row) =>
                WorkspaceGetSuccess.make({
                  workspace: row?.workspace ?? null
                })
            )
          )
        )
        .handle('putWorkspace', ({ payload }) =>
          Effect.flatMap(CurrentUser, (user) =>
            Effect.flatMap(
              Effect.tryPromise({
                try: () =>
                  sql
                    .updateTable('users')
                    .set({ workspace: payload.workspace })
                    .where('id', '=', user.id)
                    .execute(),
                catch: (cause) => cause
              }).pipe(Effect.orDie),
              () => Effect.succeed(WorkspaceSavedSuccess.make({}))
            )
          )
        )
  })
)
