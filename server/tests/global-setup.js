// Runs once before the integration suite: makes sure imizamo_test exists,
// then rebuilds it from src/db/schema.sql (which also seeds the 5 classes).
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { TEST_DATABASE_URL, assertSafeTestDatabase } from './test-config.js'

const schemaPath = fileURLToPath(new URL('../src/db/schema.sql', import.meta.url))

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

  const schema = await readFile(schemaPath, 'utf8')
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
    await client.query(schema)
  } finally {
    await client.end()
  }
}
