// Settings shared by prepare.mjs (database setup) and playwright.config.js
// (the servers). TEST-ONLY values: nothing here is a real secret.
//
// The tests use the same local database as the server's Jest suite
// (imizamo_test), so TEST_DATABASE_URL works for both. Set E2E_DATABASE_URL to
// use a different imizamo_test, for example on another port.
import { TEST_DATABASE_URL, assertSafeTestDatabase } from '../server/tests/test-config.js'

export const databaseUrl = process.env.E2E_DATABASE_URL ?? TEST_DATABASE_URL
assertSafeTestDatabase(databaseUrl)

export const API_PORT = '4000'
export const CLIENT_URL = 'http://localhost:5173'

/** Environment for the Express server and the seed script. */
export const serverEnv = {
  NODE_ENV: 'test', // stops the server reading a real .env file
  PORT: API_PORT,
  CLIENT_ORIGIN: CLIENT_URL,
  DATABASE_URL: databaseUrl,
  DB_SSL: 'false',
  JWT_SECRET: 'e2e-secret-do-not-use-in-production',
}
