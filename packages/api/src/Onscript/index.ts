import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import BadRequestError from '../common/BadRequestError'
import NotFoundError from '../common/NotFoundError'
import OnscriptError from '../common/OnscriptError'
import UnauthorizedError from '../common/UnauthorizedError'

export const Platform = Schema.Union(
  Schema.Literal('TWITTER'),
  Schema.Literal('FACEBOOK'),
  Schema.Literal('INSTAGRAM')
)

export class AccountsSuccess extends Schema.TaggedClass<AccountsSuccess>()(
  'AccountsSuccess',
  {
    // Only accounts mapped to the signed-in CrowdPilot user — connected
    // accounts live under one shared Onscript account, and ownership is
    // CrowdPilot's job (connected_accounts table).
    accounts: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        platform: Platform,
        username: Schema.optional(Schema.String),
        displayName: Schema.optional(Schema.String),
        isActive: Schema.Boolean
      })
    )
  }
) {}

const ConnectUrlPayload = Schema.Struct({ platform: Platform })

export class ConnectUrlSuccess extends Schema.TaggedClass<ConnectUrlSuccess>()(
  'ConnectUrlSuccess',
  { authUrl: Schema.String }
) {}

const ClaimedAccount = Schema.Struct({
  id: Schema.String,
  platform: Platform,
  username: Schema.optional(Schema.String),
  displayName: Schema.optional(Schema.String)
})

export class ConnectClaimSuccess extends Schema.TaggedClass<ConnectClaimSuccess>()(
  'ConnectClaimSuccess',
  {
    claimed: Schema.Boolean,
    account: Schema.optional(ClaimedAccount)
  }
) {}

const DisconnectPayload = Schema.Struct({ accountId: Schema.String })

export class OkSuccess extends Schema.TaggedClass<OkSuccess>()('OkSuccess', {}) {}

const accounts = HttpApiEndpoint.get('onscriptAccounts', '/onscript/accounts')
  .addSuccess(AccountsSuccess)
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    "The social accounts mapped to the signed-in CrowdPilot user. Empty until they connect one (Accounts page)."
  )

const connectUrl = HttpApiEndpoint.post(
  'onscriptConnectUrl',
  '/onscript/connect/url'
)
  .setPayload(ConnectUrlPayload)
  .addSuccess(ConnectUrlSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Starts a connect: returns the Onscript-hosted OAuth url for the platform. Open it in a popup, then call /onscript/connect/claim after it closes (or poll /onscript/accounts).'
  )

const connectClaim = HttpApiEndpoint.post(
  'onscriptConnectClaim',
  '/onscript/connect/claim'
)
  .addSuccess(ConnectClaimSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Claims the social account that just finished the OAuth popup for the signed-in user (matched against the pending connect started by /onscript/connect/url). claimed=false when nothing new appeared yet.'
  )

const disconnectAccount = HttpApiEndpoint.post(
  'onscriptDisconnectAccount',
  '/onscript/disconnect'
)
  .setPayload(DisconnectPayload)
  .addSuccess(OkSuccess)
  .addError(NotFoundError, { status: 404 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Disconnects one of the signed-in user\u2019s own connected accounts (404 for accounts owned by other users).'
  )

const OnscriptApi = HttpApiGroup.make('Onscript')
  .add(accounts)
  .add(connectUrl)
  .add(connectClaim)
  .add(disconnectAccount)

export default OnscriptApi
