import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import NotFoundError from '../common/NotFoundError'
import UnexpectedError from '../common/UnexpectedError'
import SessionMiddleware from '../Auth/SessionMiddleware'

export class EvidenceSuccess extends Schema.TaggedClass<EvidenceSuccess>()(
  'EvidenceSuccess',
  {
    refId: Schema.String,
    request: Schema.Unknown,
    response: Schema.Unknown,
    timestamp: Schema.String
  }
) {}

const EvidenceEndpoint = HttpApiEndpoint.get(
  'qlooEvidence',
  '/qloo/evidence/:refId'
)
  .setPath(Schema.Struct({ refId: Schema.String }))
  .addSuccess(EvidenceSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Returns a stored Qloo call (full request/response pair) by evidence ref id.'
  )

export default EvidenceEndpoint
