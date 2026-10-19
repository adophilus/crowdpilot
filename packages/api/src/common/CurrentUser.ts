import { Context } from 'effect'

export interface SessionUser {
  id: string
  email: string
}

class CurrentUser extends Context.Tag('CurrentUser')<CurrentUser, SessionUser>() {}

export default CurrentUser
