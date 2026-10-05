// Runs before every test file (unit and integration). Sets TEST-ONLY env
// values before any app module is imported, so src/config/env.js never
// falls back to the real .env file (it skips dotenv when NODE_ENV=test).
import { TEST_ENV, assertSafeTestDatabase } from './test-config.js'

Object.assign(process.env, TEST_ENV)
assertSafeTestDatabase(process.env.DATABASE_URL)
