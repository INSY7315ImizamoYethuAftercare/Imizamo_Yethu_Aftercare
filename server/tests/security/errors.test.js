// Error handling as the app runs under test/dev config: 404s are JSON, and
// error bodies must not leak stack traces or SQL.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { leaksInternals } from '../helpers/assertions.js'
import { classIdByName, resetDb, withFailingInsert } from '../helpers/db.js'
import { createUser } from '../helpers/factory.js'

const app = await loadApp()

beforeEach(resetDb)

describe('unknown routes', () => {
  it.each([
    ['get', '/api/does-not-exist'],
    ['post', '/api/nope'],
    ['get', '/nothing-here'],
    ['delete', '/api/auth/login'],
  ])('%s %s -> 404 JSON with a message', async (method, path) => {
    const res = await request(app)[method](path)
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body.message).toMatch(/Route not found/)
  })

  it('GET /api/health is public and healthy', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('error bodies', () => {
  it('a 401 response carries no stack trace', async () => {
    const res = await request(app).get('/api/learners')
    expect(res.status).toBe(401)
    expect(res.body).not.toHaveProperty('stack')
  })

  it('a 500 response leaks neither a stack trace nor SQL', async () => {
    const manager = await createUser('manager')
    const classId = await classIdByName('Yellow')
    const res = await withFailingInsert('learners', 'syntax error at or near "SELECT * FROM users"', () =>
      request(app).post('/api/learners').set('Cookie', manager.cookie).send({ classId, firstName: 'A', lastName: 'B' }),
    )
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ message: 'Internal server error' })
    expect(leaksInternals(res.body)).toBe(false)
  })
})
