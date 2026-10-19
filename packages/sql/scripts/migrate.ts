import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

// Usage: pnpm --filter @crowdpilot/sql migrate
// (loads DATABASE_URL from the repo-root .env.development)
const migrationsDir = join(import.meta.dirname, '..', 'migrations')

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`
  )

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const applied = await client.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [file]
    )
    if ((applied.rowCount ?? 0) > 0) {
      console.log(`skipping ${file} (already applied)`)
      continue
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file
      ])
      await client.query('COMMIT')
      console.log(`applied ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }

  await client.end()
  console.log('migrations up to date')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
