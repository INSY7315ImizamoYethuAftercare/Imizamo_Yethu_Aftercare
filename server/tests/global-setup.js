// Runs once before the integration suite: makes sure imizamo_test exists,
// then rebuilds it from the migration files.
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { runner } from 'node-pg-migrate'
import { TEST_DATABASE_URL, assertSafeTestDatabase } from './test-config.js'

const migrationsDir = fileURLToPath(new URL('../src/db/migrations', import.meta.url))

async function ensureDatabaseExists() {
  const adminUrl = new URL(TEST_DATABASE_URL)
  adminUrl.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'imizamo_test'")
    if (rowCount === 0) await admin.query('CREATE DATABASE imizamo_test')
  } finally {
    await admin.end()
  }
}

export default async function globalSetup() {
  assertSafeTestDatabase(TEST_DATABASE_URL)
  await ensureDatabaseExists()

  const client = new pg.Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
  } finally {
    await client.end()
  }

  await runner({
    databaseUrl: TEST_DATABASE_URL,
    dir: migrationsDir,
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => {},
  })
}