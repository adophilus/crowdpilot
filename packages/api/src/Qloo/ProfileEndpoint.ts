import { HttpApiEndpoint, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import NotFoundError from '../common/NotFoundError'
import UnexpectedError from '../common/UnexpectedError'
import SessionMiddleware from '../Auth/SessionMiddleware'

export class ProfilePayload extends Schema.Class<ProfilePayload>(
  'ProfilePayload'
)({
  entityIds: Schema.Array(Schema.String),
  tagIds: Schema.optional(Schema.Array(Schema.String))
}) {}

const AffinityPick = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  type: Schema.String,
  score: Schema.Number
})

const Affinity = Schema.Struct({
  domain: Schema.String,
  picks: Schema.Array(AffinityPick)
})

export class ProfileSuccess extends Schema.TaggedClass<ProfileSuccess>()(
  'ProfileSuccess',
  {
    topTags: Schema.Array(
      Schema.Struct({ tag: Schema.String, score: Schema.Number })
    ),
    affinities: Schema.Array(Affinity),
    evidenceRefs: Schema.Array(Schema.String)
  }
) {}

const ProfileEndpoint = HttpApiEndpoint.post('qlooProfile', '/qloo/profile')
  .setPayload(ProfilePayload)
  .addSuccess(ProfileSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Builds a crowd taste-profile card from Qloo entity ids (multi-domain affinities + top tags). Every internal Qloo call is logged to the evidence store.'
  )

export default ProfileEndpoint
