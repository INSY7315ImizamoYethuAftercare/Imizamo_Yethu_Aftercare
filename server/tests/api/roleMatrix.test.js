// #51 — Role-access matrix: every protected route x every role (+ anonymous).
// Allowed roles must get through the role gate (not 401/403) without a 500;
// every other role gets 403; anonymous gets 401.
// Each route gets a fresh data set, since some allowed calls change data.
import { beforeAll, describe, expect, it } from '@jest/globals'
import { readdir, readFile } from 'node:fs/promises'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { ROLES } from '../helpers/factory.js'
import { PROTECTED_ROUTES, send } from '../helpers/routes.js'
import { buildWorld } from '../helpers/world.js'

const app = await loadApp()

// Routes actually registered in src/routes/*.js, as "METHOD /full/path".
const MOUNTS = {
  'attendance.routes.js': '/api/attendance', 'auth.routes.js': '/api/auth', 'guardian.routes.js': '/api/guardian',
  'learner.routes.js': '/api/learners', 'observation.routes.js': '/api/observations', 'report.routes.js': '/api/reports',
  'schoolClass.routes.js': '/api/classes', 'signout.routes.js': '/api/signout', 'teacher.routes.js': '/api/teacher',
  'health.routes.js': '/api',
}
const PUBLIC = ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/health']
const routesDir = new URL('../../src/routes/', import.meta.url)
const registered = []
for (const file of await readdir(routesDir)) {
  const src = await readFile(new URL(file, routesDir), 'utf8')
  for (const [, method, path] of src.matchAll(/\.(get|post|patch|put|delete)\(\s*'([^']+)'/g)) {
    registered.push(`${method.toUpperCase()} ${MOUNTS[file]}${path === '/' ? '' : path}`)
  }
}
const protectedRegistered = registered.filter((r) => !PUBLIC.includes(r))
const routes = PROTECTED_ROUTES.filter((r) => protectedRegistered.includes(r.name))

it('every registered protected route is in the matrix catalogue (tests/helpers/routes.js)', () => {
  const catalogued = PROTECTED_ROUTES.map((r) => r.name)
  expect(protectedRegistered.filter((r) => !catalogued.includes(r))).toEqual([])
})

describe.each(routes)('$name', (route) => {
  let world
  beforeAll(async () => {
    world = await buildWorld()
  })

  it('anonymous -> 401', async () => {
    const res = await send(request(app), route, world, null)
    expect(res.status).toBe(401)
  })

  // Refused roles go first: an allowed call can change the data (e.g. a
  // manager deactivating the test teacher), which must not affect them.
  const order = [...ROLES].sort((a, b) => route.allowed.includes(a) - route.allowed.includes(b))

  it.each(order)('%s', async (role) => {
    const res = await send(request(app), route, world, world.users[role])
    if (route.allowed.includes(role)) {
      expect([401, 403]).not.toContain(res.status)
      expect(res.status).toBeLessThan(500)
    } else {
      expect(res.status).toBe(403)
    }
  })
})

