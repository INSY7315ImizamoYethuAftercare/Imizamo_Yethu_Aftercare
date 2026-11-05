// The OpenAPI docs must describe every route the API really has. This fails
// when a route is added (to tests/helpers/routes.js) but not to
// src/docs/openapi.yaml, so the docs can't quietly fall out of date.
import { describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { PROTECTED_ROUTES } from '../helpers/routes.js'

const app = await loadApp()
const { openApiSpec } = await import('../../src/routes/docs.routes.js')

// Routes not in the role matrix: public ones, and protected ones it doesn't list yet.
const OTHER_ROUTES = [
  'GET /api/health',
  'POST /api/auth/register',
  'POST /api/auth/login',
  'POST /api/auth/logout',
  'GET /api/learners/:learnerId/overview',
]

const PUBLIC_ROUTES = ['GET /api/health', 'POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout']

// "PATCH /api/learners/:learnerId" -> ['patch', '/api/learners/{learnerId}']
const toSpec = (name) => {
  const [method, path] = name.split(' ')
  return [method.toLowerCase(), path.replace(/:(\w+)/g, '{$1}')]
}
const operationFor = (name) => {
  const [method, path] = toSpec(name)
  return openApiSpec.paths[path]?.[method]
}

const ALL_ROUTES = [...PROTECTED_ROUTES.map((r) => r.name), ...OTHER_ROUTES]

describe('OpenAPI spec', () => {
  it.each(ALL_ROUTES)('documents %s', (name) => {
    expect(operationFor(name)).toBeDefined()
  })

  it('documents nothing that does not exist', () => {
    const documented = Object.entries(openApiSpec.paths).flatMap(([path, ops]) =>
      Object.keys(ops).map((method) => `${method} ${path}`),
    )
    const real = new Set(ALL_ROUTES.map((name) => toSpec(name).join(' ')))
    expect(documented.filter((op) => !real.has(op))).toEqual([])
  })

  it.each(PROTECTED_ROUTES.map((r) => r.name))('%s says it needs a login and documents 401', (name) => {
    const op = operationFor(name)
    expect(op.security).toBeUndefined() // inherits the global cookieAuth
    expect(op.responses['401']).toBeDefined()
  })

  it.each(PUBLIC_ROUTES)('%s is marked public', (name) => {
    expect(operationFor(name).security).toEqual([])
  })

  it('describes errors with the same { message } body the API sends', () => {
    expect(openApiSpec.components.schemas.Error.properties).toEqual({ message: { type: 'string' } })
  })
})

describe('docs endpoints', () => {
  it('GET /api/openapi.json returns the spec without a login', async () => {
    const res = await request(app).get('/api/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toMatch(/^3\./)
    expect(res.body.info.title).toBe('Imizamo Yethu Aftercare API')
  })

  it('GET /api/docs/ serves the Swagger UI page and its files', async () => {
    const page = await request(app).get('/api/docs/')
    expect(page.status).toBe(200)
    expect(page.headers['content-type']).toMatch(/text\/html/)
    expect(page.text).toContain('swagger-ui')

    const init = await request(app).get('/api/docs/swagger-ui-init.js')
    expect(init.status).toBe(200)
    expect(init.text).toContain('Imizamo Yethu Aftercare API')
  })

  it('keeps the security headers on the docs page', async () => {
    const res = await request(app).get('/api/docs/')
    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})
