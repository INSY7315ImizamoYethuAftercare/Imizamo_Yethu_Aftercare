// #50 — Brute-force protection: 5 login attempts per 15 minutes per IP.
// Uses the real rate limiter (every other suite swaps it for a pass-through).
import { beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { resetDb } from '../helpers/db.js'
import { TEST_PASSWORD, createUser } from '../helpers/factory.js'

const app = await loadApp({ rateLimit: true })

describe('login rate limiting', () => {
  let user
  beforeAll(async () => {
    await resetDb()
    user = await createUser('teacher')
  })

  it('allows 5 attempts, then answers 429 with a JSON message', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' })
      expect(res.status).toBe(401)
    }
    const blocked = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' })
    expect(blocked.status).toBe(429)
    expect(blocked.body).toEqual({ message: 'Too many requests, please try again later.' })
    expect(blocked.headers).toHaveProperty('retry-after')
  })

  it('keeps blocking even the correct password once the limit is hit', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORD })
    expect(res.status).toBe(429)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('sends standard RateLimit headers', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' })
    expect(Object.keys(res.headers).some((h) => h.startsWith('ratelimit'))).toBe(true)
  })

  it('does not rate-limit other auth endpoints', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
  })
})

describe('change-password rate limiting', () => {
  const change = (u, currentPassword) =>
    request(app).post('/api/auth/change-password').set('Cookie', u.cookie).send({ currentPassword, newPassword: 'Brand-new-pass-1' })

  it('allows 5 wrong current passwords per account, then blocks even the right one (429)', async () => {
    const user = await createUser('teacher')
    for (let i = 0; i < 5; i += 1) expect((await change(user, 'wrong')).status).toBe(400)
    expect((await change(user, TEST_PASSWORD)).status).toBe(429)

    // Counted per account: someone else on the same network is unaffected.
    const other = await createUser('teacher')
    expect((await change(other, TEST_PASSWORD)).status).toBe(200)
  })
})
