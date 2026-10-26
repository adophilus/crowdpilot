import type { ColumnType } from 'kysely'

export interface UsersTable {
  id: ColumnType<string, never, never>
  email: ColumnType<string, string, string>
  taste_profile: ColumnType<
    unknown,
    unknown | null | undefined,
    unknown | null | undefined
  >
  workspace: ColumnType<
    unknown,
    unknown | null | undefined,
    unknown | null | undefined
  >
  created_at: ColumnType<Date, never, never>
}

export interface SessionsTable {
  token_hash: ColumnType<string, string, never>
  user_id: ColumnType<string, string, never>
  expires_at: ColumnType<Date, Date, never>
  created_at: ColumnType<Date, never, never>
}

export interface ConnectedAccountsTable {
  id: ColumnType<string, never, never>
  user_id: ColumnType<string, string, never>
  platform: ColumnType<string, string, never>
  onscript_account_id: ColumnType<string, string, never>
  connected_at: ColumnType<Date, never, never>
}

export interface OnscriptSessionsTable {
  user_id: ColumnType<string, string, never>
  email: ColumnType<string, string, string>
  access_token: ColumnType<string, string, string>
  created_at: ColumnType<Date, never, never>
}

export interface PostsTable {
  id: ColumnType<string, never, never>
  user_id: ColumnType<string, string, never>
  onscript_post_id: ColumnType<string, string, never>
  text: ColumnType<string, string, never>
  platforms: ColumnType<string[], string[], string[]>
  status: ColumnType<string, string, string>
  permalink: ColumnType<
    string | undefined,
    string | undefined,
    string | undefined
  >
  created_at: ColumnType<Date, never, never>
}

export interface Database {
  users: UsersTable
  sessions: SessionsTable
  connected_accounts: ConnectedAccountsTable
  onscript_sessions: OnscriptSessionsTable
  posts: PostsTable
}
