// The admin home page reads today's totals from GET /api/reports/overview.
// Admins may see counts but never individual learners (POPIA).
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser, linkGuardian, markAttendance } from '../helpers/factory.js'

const app = await loadApp()

let admin
let teacher

beforeEach(async () => {
  await resetDb()
  admin = await createUser('admin_standard')
  teacher = await createUser('teacher')
  const aisha = await createLearner({ className: 'Yellow', firstName: 'Aisha', lastName: 'Petersen' })
  const liam = await createLearner({ className: 'Yellow', firstName: 'Liam', lastName: 'Botha' })
  const zoe = await createLearner({ className: 'Green', firstName: 'Zoe', lastName: 'Ntombela' })
  const gone = await createLearner({ className: 'Green', firstName: 'Gone', lastName: 'Away' })
  await pool.query('UPDATE learners SET "is_active" = false WHERE "learner_id" = $1', [gone.learner_id])

  await markAttendance(aisha, teacher)
  await markAttendance(zoe, teacher)
  await markAttendance(liam, teacher, { status: 'absent' })

  // Aisha has been collected.
  const mum = await createUser('guardian', { fullName: 'Fatima Petersen' })
  await linkGuardian(aisha, mum)
  await pool.query(
    `INSERT INTO sign_out_records ("learner_id", "teacher_id", "guardian_id", "record_date", "time_out")
     VALUES ($1, $2, $3, (now() AT TIME ZONE 'Africa/Johannesburg')::date, '17:00')`,
    [aisha.learner_id, teacher.profile.teacher_id, mum.profile.guardian_id],
  )
})

const overview = (user = admin) => request(app).get('/api/reports/overview').set('Cookie', user.cookie)

describe("GET /api/reports/overview: today's numbers", () => {
  it('gives totals and every active class, with present / active learners', async () => {
    const res = await overview()
    expect(res.status).toBe(200)
    const today = res.body.today
    expect(today.date).toBe(new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }))
    expect(today).toMatchObject({ present: 2, activeLearners: 3, signedOut: 1 })

    const byName = Object.fromEntries(today.classes.map((c) => [c.name, c]))
    expect(Object.keys(byName).sort()).toEqual(['Blue', 'Green', 'Orange', 'Red', 'Yellow'])
    expect(byName.Yellow).toMatchObject({ present: 1, activeLearners: 2 })
    expect(byName.Green).toMatchObject({ present: 1, activeLearners: 1 }) // the deactivated learner isn't counted
    expect(byName.Red).toMatchObject({ present: 0, activeLearners: 0 })
  })

  it('works for both kinds of admin, and managers', async () => {
    for (const role of ['admin_master', 'manager']) {
      const res = await overview(await createUser(role))
      expect(res.status).toBe(200)
      expect(res.body.today.present).toBe(2)
    }
  })

  it("contains no learner's or guardian's name (POPIA)", async () => {
    const body = JSON.stringify((await overview()).body)
    for (const name of ['Aisha', 'Liam', 'Zoe', 'Petersen', 'Botha', 'Ntombela', 'Fatima']) {
      expect(body).not.toContain(name)
    }
  })

  it.each(['teacher', 'guardian'])('is refused to a %s (403)', async (role) => {
    expect((await overview(await createUser(role))).status).toBe(403)
  })
})

describe('Admins still cannot reach learner-level data', () => {
  it.each([
    '/api/learners',
    '/api/classes',
    '/api/attendance/class/1',
  ])('%s is refused (403)', async (path) => {
    expect((await request(app).get(path).set('Cookie', admin.cookie)).status).toBe(403)
  })
})
