import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import NotFoundError from '../common/NotFoundError'
import UnexpectedError from '../common/UnexpectedError'

export class GeneratedDirection extends Schema.Struct({
  id: Schema.String,
  goal: Schema.Union(
    Schema.Literal('break'),
    Schema.Literal('deep'),
    Schema.Literal('niche')
  ),
  kind: Schema.String,
  fill: Schema.Union(
    Schema.Literal(100),
    Schema.Literal(60),
    Schema.Literal(35)
  ),
  title: Schema.String,
  summary: Schema.String,
  receipts: Schema.Array(Schema.String)
}) {}

export class GenerateDirectionsSuccess extends Schema.TaggedClass<GenerateDirectionsSuccess>()(
  'GenerateDirectionsSuccess',
  { directions: Schema.Array(GeneratedDirection) }
) {}

const generateDirections = HttpApiEndpoint.post(
  'generateDirections',
  '/directions/generate'
)
  .addSuccess(GenerateDirectionsSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Generates growth directions from the stored Qloo taste profile via LLM. Requires a completed audience read first.'
  )

const DirectionsApi = HttpApiGroup.make('Directions').add(generateDirections)

export default DirectionsApi
