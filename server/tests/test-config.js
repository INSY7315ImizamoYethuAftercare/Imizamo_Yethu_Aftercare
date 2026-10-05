// TEST-ONLY configuration. Nothing here is a real secret, and nothing here
// may ever point at imizamo_dev or Azure.
//
// The database URL can be overridden with TEST_DATABASE_URL (e.g. when your
// local postgres password isn't "postgres"), but the database name must
// still be imizamo_test on a local host: assertSafeTestDatabase() enforces it.

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/imizamo_test'

export const TEST_ENV = {
  NODE_ENV: 'test',
  PORT: '0',
  CLIENT_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: TEST_DATABASE_URL,
  DB_SSL: 'false',
  JWT_SECRET: 'test-secret-do-not-use-in-production',
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** Throws unless the URL is the local imizamo_test database. */
export function assertSafeTestDatabase(url = TEST_DATABASE_URL) {
  const parsed = new URL(url)
  const dbName = parsed.pathname.replace(/^\//, '')
  if (dbName !== 'imizamo_test' || !LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Refusing to run tests against "${parsed.hostname}/${dbName}". Tests only ever use localhost/imizamo_test.`,
    )
  }
}
