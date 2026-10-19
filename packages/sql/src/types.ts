import type { ColumnType } from 'kysely'

export interface UsersTable {
  id: ColumnType<string, never, never>
  email: ColumnType<string, string, string>
  taste_profile: ColumnType<
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

export interface Database {
  users: UsersTable
  sessions: SessionsTable
  connected_accounts: ConnectedAccountsTable
}
