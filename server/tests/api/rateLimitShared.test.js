// #50 — The login limiter must stop brute force without locking out a whole
// site that shares one public IP (staff Wi-Fi, Azure front ends).
// Separate file so it gets its own, untouched limiter instances. Each test
// uses its own X-Forwarded-For client IP (the app trusts one proxy hop, as on
// Azure), so the tests don't share buckets.
import { beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { resetDb } from '../helpers/db.js'
import { TEST_PASSWORD, createUser } from '../helpers/factory.js'

const app = await loadApp({ rateLimit: true })

const login = (ip, email, password) =>
  request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({ email, password })

describe('login limiter on a shared IP', () => {
  let staff
  beforeAll(async () => {
    await resetDb()
    staff = []
    for (let i = 0; i < 6; i += 1) staff.push(await createUser('teacher'))
  })

  it('lets a 6th colleague sign in after 5 successful logins from the same IP', async () => {
    for (const u of staff.slice(0, 5)) {
      expect((await login('198.51.100.10', u.email, TEST_PASSWORD)).status).toBe(200)
    }
    expect((await login('198.51.100.10', staff[5].email, TEST_PASSWORD)).status).toBe(200)
  })

  it("does not lock a colleague out because someone else mistyped their own password 5 times", async () => {
    for (let i = 0; i < 5; i += 1) expect((await login('198.51.100.20', staff[0].email, 'wrong')).status).toBe(401)
    expect((await login('198.51.100.20', staff[0].email, 'wrong')).status).toBe(429)
    expect((await login('198.51.100.20', staff[1].email, TEST_PASSWORD)).status).toBe(200)
  })

  it('treats the email case-insensitively, so changing case does not reset the count', async () => {
    for (let i = 0; i < 5; i += 1) await login('198.51.100.30', staff[2].email, 'wrong')
    expect((await login('198.51.100.30', staff[2].email.toUpperCase(), 'wrong')).status).toBe(429)
  })

  it('caps failed attempts across many accounts from one IP at 30', async () => {
    for (let i = 0; i < 30; i += 1) {
      expect((await login('198.51.100.40', `nobody${i}@test.iylh.org`, 'wrong')).status).toBe(401)
    }
    expect((await login('198.51.100.40', 'someone.else@test.iylh.org', 'wrong')).status).toBe(429)
  })

  it('keeps different client IPs apart', async () => {
    for (let i = 0; i < 5; i += 1) await login('198.51.100.50', staff[3].email, 'wrong')
    expect((await login('198.51.100.50', staff[3].email, 'wrong')).status).toBe(429)
    expect((await login('198.51.100.51', staff[3].email, TEST_PASSWORD)).status).toBe(200)
  })

  it('ignores the port Azure appends to X-Forwarded-For (one client, one bucket)', async () => {
    for (let i = 0; i < 5; i += 1) await login(`198.51.100.60:${50000 + i}`, staff[4].email, 'wrong')
    expect((await login('198.51.100.60:59999', staff[4].email, 'wrong')).status).toBe(429)
  })
})
