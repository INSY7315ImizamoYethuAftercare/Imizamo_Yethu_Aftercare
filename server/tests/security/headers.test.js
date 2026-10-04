// Security configuration: CORS and helmet headers. No database needed.
import { describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'

const app = await loadApp()
const ALLOWED = process.env.CLIENT_ORIGIN // http://localhost:5173 in tests/setup-env.js

describe('CORS', () => {
  it('echoes the configured origin with credentials allowed', async () => {
    const res = await request(app).get('/api/health').set('Origin', ALLOWED)
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED)
    expect(res.headers['access-control-allow-credentials']).toBe('true')
  })

  it.each(['https://evil.example', 'http://localhost:5174', 'null'])('does not allow origin %s', async (origin) => {
    const res = await request(app).get('/api/health').set('Origin', origin)
    expect(res.headers['access-control-allow-origin']).not.toBe(origin)
    expect(res.headers['access-control-allow-origin']).not.toBe('*')
  })

  it('answers a preflight from the configured origin', async () => {
    const res = await request(app)
      .options('/api/attendance')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED)
  })

  it('never grants a preflight from another origin (only the fixed allowed origin is ever sent)', async () => {
    const res = await request(app)
      .options('/api/attendance')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST')
    // cors() with a fixed origin always replies with that origin; the browser
    // then blocks evil.example because it does not match.
    expect([undefined, ALLOWED]).toContain(res.headers['access-control-allow-origin'])
  })
})

describe('helmet security headers', () => {
  it('are present on API responses', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/)
    expect(res.headers['content-security-policy']).toMatch(/default-src 'self'/)
    expect(res.headers['referrer-policy']).toBe('no-referrer')
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin')
  })

  it('do not advertise Express', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('are present on error responses too', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})
