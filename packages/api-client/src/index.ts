import { HttpClient, HttpClientRequest, HttpApiClient } from '@effect/platform'
import { Option } from 'effect'
import { Api } from '@crowdpilot/api'
import type { paths } from '@crowdpilot/api-client-types'
import createClient from 'openapi-fetch'
import createReactQueryClient from 'openapi-react-query'

export const createFetchClient = (baseUrl: string) =>
  createClient<paths>({
    baseUrl
  })

type FetchClient = ReturnType<typeof createFetchClient>

export const createTanstackQueryClient = (client: FetchClient) =>
  createReactQueryClient(client)

export type MakeApiClientArgs = Partial<{
  accessToken: string
  baseUrl: string
}>

export const makeApiClient = ({ accessToken, baseUrl }: MakeApiClientArgs) =>
  HttpApiClient.make(Api, {
    baseUrl,
    transformClient: (client) =>
      client.pipe(
        HttpClient.mapRequest((request) =>
          Option.fromNullable(accessToken).pipe(
            Option.map((accessToken) =>
              request.pipe(HttpClientRequest.bearerToken(accessToken))
            ),
            Option.getOrElse(() => request)
          )
        )
      )
  })
