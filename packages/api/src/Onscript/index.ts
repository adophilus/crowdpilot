import { HttpApiEndpoint, HttpApiGroup, OpenApi } from '@effect/platform'
import { Schema } from 'effect'
import SessionMiddleware from '../Auth/SessionMiddleware'
import BadRequestError from '../common/BadRequestError'
import OnscriptError from '../common/OnscriptError'
import UnauthorizedError from '../common/UnauthorizedError'

export const Platform = Schema.Union(
  Schema.Literal('TWITTER'),
  Schema.Literal('FACEBOOK'),
  Schema.Literal('INSTAGRAM')
)

export class SessionStatusSuccess extends Schema.TaggedClass<SessionStatusSuccess>()(
  'SessionStatusSuccess',
  {
    // linked = the session carries a user-owned Onscript token; when false
    // all Onscript calls fall back to the shared CrowdPilot service account.
    linked: Schema.Boolean,
    email: Schema.optional(Schema.String),
    usingServiceAccount: Schema.Boolean
  }
) {}

export class LinkStartPayload extends Schema.Class<LinkStartPayload>('LinkStartPayload')({
  email: Schema.String
}) {}

export class LinkVerifyPayload extends Schema.Class<LinkVerifyPayload>('LinkVerifyPayload')({
  email: Schema.String,
  otp: Schema.String
}) {}

export class LinkVerifySuccess extends Schema.TaggedClass<LinkVerifySuccess>()(
  'LinkVerifySuccess',
  { email: Schema.String }
) {}

export class OkSuccess extends Schema.TaggedClass<OkSuccess>()('OkSuccess', {
  ok: Schema.Literal(true)
}) {}

export class AccountsSuccess extends Schema.TaggedClass<AccountsSuccess>()(
  'AccountsSuccess',
  {
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

export class ConnectUrlPayload extends Schema.Class<ConnectUrlPayload>('ConnectUrlPayload')({
  platform: Platform
}) {}

export class ConnectUrlSuccess extends Schema.TaggedClass<ConnectUrlSuccess>()(
  'ConnectUrlSuccess',
  { authUrl: Schema.String }
) {}

export class DisconnectPayload extends Schema.Class<DisconnectPayload>('DisconnectPayload')({
  accountId: Schema.String
}) {}

const sessionStatus = HttpApiEndpoint.get('sessionStatus', '/onscript/session')
  .addSuccess(SessionStatusSuccess)
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Onscript link status for the signed-in CrowdPilot user.'
  )

const linkStart = HttpApiEndpoint.post('linkStart', '/onscript/link/start')
  .setPayload(LinkStartPayload)
  .addSuccess(OkSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Starts the Onscript account link: sends an Onscript sign-in OTP to the given email.'
  )

const linkVerify = HttpApiEndpoint.post('linkVerify', '/onscript/link/verify')
  .setPayload(LinkVerifyPayload)
  .addSuccess(LinkVerifySuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Verifies the Onscript OTP and stores the Onscript session token for this CrowdPilot user.'
  )

const linkDisconnect = HttpApiEndpoint.post(
  'linkDisconnect',
  '/onscript/link/disconnect'
)
  .addSuccess(OkSuccess)
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Removes the stored Onscript session token; falls back to the service account.'
  )

const accounts = HttpApiEndpoint.get('onscriptAccounts', '/onscript/accounts')
  .addSuccess(AccountsSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Connected social accounts, from the linked Onscript account or the service account.'
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
    'Returns the Onscript-hosted OAuth url for connecting a platform account. Open it in a popup, then poll /onscript/accounts until the account appears.'
  )

const disconnectAccount = HttpApiEndpoint.post(
  'onscriptDisconnectAccount',
  '/onscript/disconnect'
)
  .setPayload(DisconnectPayload)
  .addSuccess(OkSuccess)
  .addError(BadRequestError, { status: 400 })
  .addError(UnauthorizedError, { status: 401 })
  .addError(OnscriptError, { status: 502 })
  .middleware(SessionMiddleware)
  .annotate(
    OpenApi.Description,
    'Disconnects a connected social account in Onscript.'
  )

const OnscriptApi = HttpApiGroup.make('Onscript')
  .add(sessionStatus)
  .add(linkStart)
  .add(linkVerify)
  .add(linkDisconnect)
  .add(accounts)
  .add(connectUrl)
  .add(disconnectAccount)

export default OnscriptApi
