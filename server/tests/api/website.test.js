// In production one Azure Web App serves the API and the built React app.
// These check the website rules with a fake build in a temporary folder.
import { afterAll, describe, expect, it } from '@jest/globals'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'

const publicDir = mkdtempSync(path.join(tmpdir(), 'iylh-public-'))
writeFileSync(path.join(publicDir, 'index.html'), '<!doctype html><title>IYLH</title><div id="root"></div>')
mkdirSync(path.join(publicDir, 'assets'))
writeFileSync(path.join(publicDir, 'assets', 'app.js'), 'console.log("app")')

const app = await loadApp({ publicDir })
const noWebsite = await loadApp({ publicDir: path.join(publicDir, 'missing') })

afterAll(() => rmSync(publicDir, { recursive: true, force: true }))

describe('with a built website', () => {
  it.each(['/', '/manager', '/manager/learners', '/parent/settings', '/admin'])('GET %s returns the React app', async (url) => {
    const res = await request(app).get(url)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toContain('<div id="root"></div>')
  })

  it('serves the built files', async () => {
    const res = await request(app).get('/assets/app.js')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/javascript/)
  })

  it('still answers the API, and unknown API routes stay JSON 404s', async () => {
    expect((await request(app).get('/api/health')).body).toMatchObject({ status: 'ok' })
    const missing = await request(app).get('/api/does-not-exist')
    expect(missing.status).toBe(404)
    expect(missing.headers['content-type']).toMatch(/json/)
  })

  it('protected API routes still need a login', async () => {
    expect((await request(app).get('/api/learners')).status).toBe(401)
  })

  it('only GET requests get the app', async () => {
    expect((await request(app).post('/manager')).status).toBe(404)
  })

  it('keeps the security headers on the website', async () => {
    const res = await request(app).get('/')
    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})

describe('without a built website (local dev, where Vite serves it)', () => {
  it('only the API answers', async () => {
    expect((await request(noWebsite).get('/')).status).toBe(404)
    expect((await request(noWebsite).get('/api/health')).status).toBe(200)
  })
})
