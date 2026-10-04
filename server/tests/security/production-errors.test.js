// Error handling with production flags. env.js is mocked (instead of setting
// NODE_ENV=production) so the real .env file is never loaded.
import { beforeAll, describe, expect, it, jest } from '@jest/globals'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { leaksInternals } from '../helpers/assertions.js'

const envPath = fileURLToPath(new URL('../../src/config/env.js', import.meta.url))
jest.unstable_mockModule(envPath, () => ({
  env: {
    nodeEnv: 'production',
    port: 0,
    clientOrigin: process.env.CLIENT_ORIGIN,
    databaseUrl: process.env.DATABASE_URL,
    dbSsl: false,
    jwtSecret: process.env.JWT_SECRET,
  },
  isProduction: true,
}))

const { loadApp } = await import('../helpers/app.js')
const { classIdByName, resetDb, withFailingInsert } = await import('../helpers/db.js')
const { createUser } = await import('../helpers/factory.js')
const app = await loadApp()

let manager
beforeAll(async () => {
  await resetDb()
  manager = await createUser('manager')
})

describe('errors in production mode', () => {
  it('a 500 says only "Internal server error"', async () => {
    const classId = await classIdByName('Yellow')
    const res = await withFailingInsert('learners', 'violates check constraint "chk_secret"', () =>
      request(app).post('/api/learners').set('Cookie', manager.cookie).send({ classId, firstName: 'A', lastName: 'B' }),
    )
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ message: 'Internal server error' })
  })

  it('a 4xx keeps its message but has no stack', async () => {
    const res = await request(app).get('/api/learners')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ message: 'Not authenticated' })
  })

  it('a 404 is JSON with no internals', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(leaksInternals(res.body)).toBe(false)
  })

  it('marks the session cookie Secure', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: manager.email, password: manager.password })
    expect(res.status).toBe(200)
    expect(res.headers['set-cookie'].find((c) => c.startsWith('token='))).toMatch(/;\s*Secure/i)
  })
})
