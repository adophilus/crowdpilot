import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import BadRequestError from '../common/BadRequestError'
import NotFoundError from '../common/NotFoundError'
import OnscriptError from '../common/OnscriptError'
import PlanLimitError from '../common/PlanLimitError'
import UnauthorizedError from '../common/UnauthorizedError'
import { Platform } from '../Onscript'

export class PostSummary extends Schema.TaggedClass<PostSummary>()(
  'PostSummary',
  {
    id: Schema.String,
    onscriptPostId: Schema.String,
    text: Schema.String,
    platforms: Schema.Array(Platform),
    // Onscript PostStatus: DRAFT | SCHEDULED | PUBLISHING |
    // PARTIALLY_PUBLISHED | PUBLISHED | FAILED | DELETING
    status: Schema.String,
    permalink: Schema.optional(Schema.String),
    createdAt: Schema.String
  }
) {}

export class PostsListSuccess extends Schema.TaggedClass<PostsListSuccess>()(
  'PostsListSuccess',
  { posts: Schema.Array(PostSummary) }
) {}

export class CreatePostPayload extends Schema.Class<CreatePostPayload>('CreatePostPayload')({
  text: Schema.String,
  platforms: Schema.Array(Platform).pipe(Schema.minItems(1)),
  publishNow: Schema.optional(Schema.Boolean),
  // unix seconds, strictly future — Onscript scheduling
  scheduledAt: Schema.optional(Schema.Number)
}) {}

export class CreatePostSuccess extends Schema.TaggedClass<CreatePostSuccess>()(
  'CreatePostSuccess',
  {
    id: Schema.String,
    onscriptPostId: Schema.String,
    status: Schema.String
  }
) {}

export class PublishSuccess extends Schema.TaggedClass<PublishSuccess>()(
  'PublishSuccess',
  { id: Schema.String, status: Schema.String }
) {}

const PlatformOutcome = Schema.Struct({
  platform: Platform,
  status: Schema.String,
  url: Schema.optional(Schema.String),
  failureReason: Schema.optional(Schema.String)
})

export class PostDetailSuccess extends Schema.TaggedClass<PostDetailSuccess>()(
  'PostDetailSuccess',
  {
    id: Schema.String,
    status: Schema.String,
    permalink: Schema.optional(Schema.String),
    perPlatform: Schema.Array(PlatformOutcome)
  }
) {}

const listPosts = HttpApiEndpoint.get('listPosts', '/posts')
  .addSuccess(PostsListSuccess)
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    "Shipped posts for the signed-in user (tracked in CrowdPilot's own DB)."
  )

const createPost = HttpApiEndpoint.post('createPost', '/posts')
  .setPayload(CreatePostPayload)
  .addSuccess(CreatePostSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(PlanLimitError, { status: 402 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Creates a post on Onscript for each requested platform (default: publish now; pass scheduledAt to schedule). 202 upstream — delivery is async, poll GET /posts/:id.'
  )

const publishPost = HttpApiEndpoint.post(
  'publishPost',
  '/posts/:id/publish'
)
  .setPath(Schema.Struct({ id: Schema.String }))
  .addSuccess(PublishSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(OpenApi.Description, 'Publishes a stored draft now.')

const getPost = HttpApiEndpoint.get('getPost', '/posts/:id')
  .setPath(Schema.Struct({ id: Schema.String }))
  .addSuccess(PostDetailSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Live status from Onscript, synced back into the local post row.'
  )

const PostsApi = HttpApiGroup.make('Posts')
  .add(listPosts)
  .add(createPost)
  .add(publishPost)
  .add(getPost)

export default PostsApi
