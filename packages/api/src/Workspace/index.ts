import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import BadRequestError from '../common/BadRequestError'
import UnauthorizedError from '../common/UnauthorizedError'

export class WorkspaceGetSuccess extends Schema.TaggedClass<WorkspaceGetSuccess>()(
  'WorkspaceGetSuccess',
  {
    // The client workspace state as free-form JSON (shape owned by the web
    // app: goal, niche, connected platforms, onboarded flag, settings...).
    workspace: Schema.Unknown
  }
) {}

export class WorkspacePutPayload extends Schema.Class<WorkspacePutPayload>()({
  workspace: Schema.Unknown
}) {}

export class WorkspaceSavedSuccess extends Schema.TaggedClass<WorkspaceSavedSuccess>()(
  'WorkspaceSavedSuccess',
  {}
) {}

const getWorkspace = HttpApiEndpoint.get('getWorkspace', '/workspace')
  .addSuccess(WorkspaceGetSuccess)
  .addError(UnauthorizedError, { status: 401 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    "Returns the signed-in user's persisted workspace state (null when none)."
  )

const putWorkspace = HttpApiEndpoint.put('putWorkspace', '/workspace')
  .setPayload(WorkspacePutPayload)
  .addSuccess(WorkspaceSavedSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    "Upserts the signed-in user's workspace state (cross-device persistence)."
  )

const WorkspaceApi = HttpApiGroup.make('Workspace')
  .add(getWorkspace)
  .add(putWorkspace)

export default WorkspaceApi
