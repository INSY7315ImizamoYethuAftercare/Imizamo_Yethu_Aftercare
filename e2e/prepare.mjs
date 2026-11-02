// Gets the database ready before the browser tests: makes sure imizamo_test
// exists, applies the migrations, then rebuilds the demo data (every role,
// password Demo-Password-2026!). Runs on every `npm run test:e2e`, so each
// run starts from the same data.
//
// The seed script itself refuses anything except a local imizamo_dev or
// imizamo_test database.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { databaseUrl, serverEnv } from './env.js'

const root = fileURLToPath(new URL('..', import.meta.url))

async function ensureDatabaseExists() {
  const adminUrl = new URL(databaseUrl)
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

function run(command) {
  console.log(`> ${command}`)
  const result = spawnSync(command, { cwd: root, env: { ...process.env, ...serverEnv }, stdio: 'inherit', shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

await ensureDatabaseExists()
run('npm run migrate --workspace server')
run('npm run seed:e2e --workspace server')
