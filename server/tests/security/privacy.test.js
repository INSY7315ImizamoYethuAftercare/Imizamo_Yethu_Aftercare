// Data privacy (POPIA): each role sees only the learner and guardian data in
// its scope. Built on the shared world: users.guardian is family A
// (learnerA), otherGuardian is family B (learnerB).
import { beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { findKeyDeep } from '../helpers/assertions.js'
import { PROTECTED_ROUTES, send } from '../helpers/routes.js'
import { buildWorld } from '../helpers/world.js'

const app = await loadApp()

let w
beforeAll(async () => {
  w = await buildWorld()
})

const get = (path, user) => request(app).get(path).set('Cookie', user.cookie)

describe('guardians', () => {
  it('see only their own children', async () => {
    const res = await get('/api/guardian/children', w.users.guardian)
    expect(res.status).toBe(200)
    expect(res.body.map((c) => c.learner_id)).toEqual([w.learnerA.learner_id])
  })

  it.each(['', '/observations'])("cannot open another family's child (…/children/:id%s) - 403", async (suffix) => {
    const res = await get(`/api/guardian/children/${w.learnerB.learner_id}${suffix}`, w.users.guardian)
    expect(res.status).toBe(403)
    expect(JSON.stringify(res.body)).not.toContain('Ntombela')
  })

  it('get the same 403 for a learner id that does not exist (no enumeration)', async () => {
    const missing = await get('/api/guardian/children/999999', w.users.guardian)
    const other = await get(`/api/guardian/children/${w.learnerB.learner_id}`, w.users.guardian)
    expect(missing.status).toBe(other.status)
    expect(missing.body.message).toBe(other.body.message)
  })

  it.each([
    '/api/learners',
    '/api/classes',
    '/api/teacher',
    '/api/reports/donor?periodStart=2026-01-01&periodEnd=2026-12-31',
  ])('cannot read %s (403)', async (path) => {
    const res = await get(path, w.users.guardian)
    expect(res.status).toBe(403)
  })

  it('cannot read class attendance or rosters (403)', async () => {
    expect((await get(`/api/attendance/class/${w.yellowId}`, w.users.guardian)).status).toBe(403)
    expect((await get(`/api/classes/${w.yellowId}/learners`, w.users.guardian)).status).toBe(403)
  })
})

describe('teachers', () => {
  it("cannot reach guardians' self-service data (403)", async () => {
    const res = await get('/api/guardian/children', w.users.teacher)
    expect(res.status).toBe(403)
  })

  it('cannot list staff accounts (403)', async () => {
    expect((await get('/api/teacher', w.users.teacher)).status).toBe(403)
  })

  it('see learner records without any guardian contact details', async () => {
    const res = await get('/api/learners', w.users.teacher)
    expect(res.status).toBe(200)
    expect(findKeyDeep(res.body, /contact_number|guardian|email/i)).toBeNull()
  })
})

describe.each(['admin_standard', 'admin_master'])('%s', (role) => {
  // A standard admin sees totals only. The master admin can do everything a
  // manager can (by design), so reads learners and classes like a manager;
  // neither admin is a guardian.
  it(role === 'admin_standard'
    ? 'cannot read individual learner, class or guardian data (403)'
    : 'can read learners, classes and the register like a manager, but not the guardian portal', async () => {
    const expected = role === 'admin_standard' ? 403 : 200
    for (const path of ['/api/learners', '/api/classes', `/api/attendance/class/${w.yellowId}`]) {
      expect((await get(path, w.users[role])).status).toBe(expected)
    }
    expect((await get('/api/guardian/children', w.users[role])).status).toBe(403)
  })

  it('gets a donor report that is aggregate only (no names, ids or dates of birth)', async () => {
    const res = await get('/api/reports/donor?periodStart=2026-01-01&periodEnd=2026-12-31', w.users[role])
    expect(res.status).toBe(200)
    const text = JSON.stringify(res.body)
    for (const name of ['Aisha', 'Petersen', 'Zoe', 'Ntombela', 'Liam']) expect(text).not.toContain(name)
    expect(findKeyDeep(res.body, /learner_id|first_name|last_name|date_of_birth|guardian/i)).toBeNull()
  })
})

describe('password_hash never leaves the API', () => {
  it.each(PROTECTED_ROUTES.filter((r) => r.method === 'get').flatMap((r) => r.allowed.map((role) => [r.name, role, r])))(
    '%s as %s',
    async (_name, role, route) => {
      const res = await send(request(app), route, w, w.users[role])
      expect(findKeyDeep(res.body, /password/i)).toBeNull()
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$\d\d\$/)
    },
  )
})
