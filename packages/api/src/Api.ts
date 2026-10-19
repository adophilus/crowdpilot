import { HttpApi, OpenApi } from '@effect/platform'
import SystemApi from './System'

const Api = HttpApi.make('CrowdPilot API')
  .annotate(OpenApi.Title, 'CrowdPilot API')
  .annotate(OpenApi.Description, 'CrowdPilot backend — Qloo-powered business co-pilot.')
  .annotate(OpenApi.Version, '0.1.0')
  .annotate(OpenApi.Servers, [
    {
      url: 'http://localhost:1050',
      description: 'local'
    },
    {
      url: 'https://api.crowdpilot.hackathons.adophilus.com',
      description: 'production'
    }
  ])
  .add(SystemApi)

export default Api
