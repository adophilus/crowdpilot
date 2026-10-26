import { HttpApi, OpenApi } from '@effect/platform'
import AuthApi from './Auth'
import ChatApi from './Chat'
import DemoApi from './Demo'
import OnscriptApi from './Onscript'
import PostsApi from './Posts'
import QlooApi from './Qloo'
import SystemApi from './System'
import WorkspaceApi from './Workspace'

const Api = HttpApi.make('CrowdPilot API')
  .annotate(OpenApi.Title, 'CrowdPilot API')
  .annotate(OpenApi.Description, 'CrowdPilot backend — Qloo-powered business co-pilot.')
  .annotate(OpenApi.Version, '0.1.0')
  .annotate(OpenApi.Servers, [
    {
      url: 'http://localhost:3010',
      description: 'local'
    },
    {
      url: 'https://api.crowdpilot.hackathons.adophilus.com',
      description: 'production'
    }
  ])
  .add(SystemApi)
  .add(AuthApi)
  .add(DemoApi)
  .add(QlooApi)
  .add(ChatApi)
  .add(OnscriptApi)
  .add(PostsApi)
  .add(WorkspaceApi)

export default Api
