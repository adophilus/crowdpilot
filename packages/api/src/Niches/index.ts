import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import NotFoundError from '../common/NotFoundError'
import UnexpectedError from '../common/UnexpectedError'
import SessionMiddleware from '../Auth/SessionMiddleware'

export class GenerateNichesSuccess extends Schema.TaggedClass<GenerateNichesSuccess>()(
  'GenerateNichesSuccess',
  { niches: Schema.Array(Schema.String) }
) {}

const generateNiches = HttpApiEndpoint.post('generateNiches', '/niches/generate')
  .addSuccess(GenerateNichesSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnexpectedError, { status: 500 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Suggests niche communities for the signed-in user, derived from their stored Qloo taste profile via the LLM. Persisted in the workspace.'
  )

const NichesApi = HttpApiGroup.make('Niches').add(generateNiches)

export default NichesApi
