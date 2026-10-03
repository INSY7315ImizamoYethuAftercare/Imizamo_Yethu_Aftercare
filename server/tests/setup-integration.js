// Runs after the test framework is installed, in every integration test file.
// Closes the shared pool so Jest can exit cleanly.
import { afterAll } from '@jest/globals'
import { pool } from '../src/db/pool.js'

afterAll(async () => {
  await pool.end()
})
