// #51 — Attendance: mark present/absent, duplicates, corrections, viewing.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { leaksInternals } from '../helpers/assertions.js'
import { classIdByName, pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser, markAttendance } from '../helpers/factory.js'

const app = await loadApp()

const todayInSA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
const asDate = (value) => (value instanceof Date ? value.toLocaleDateString('en-CA') : String(value).slice(0, 10))

let teacher
let manager
let learner
let yellowId

beforeEach(async () => {
  await resetDb()
  teacher = await createUser('teacher')
  manager = await createUser('manager')
  learner = await createLearner({ className: 'Yellow' })
  yellowId = await classIdByName('Yellow')
})

const post = (body, user = teacher) => request(app).post('/api/attendance').set('Cookie', user.cookie).send(body)

describe('POST /api/attendance', () => {
  it('marks a learner present for today (SA time) with an arrival time', async () => {
    const res = await post({ learnerId: learner.learner_id, classId: yellowId, status: 'present' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ learner_id: learner.learner_id, status: 'present' })

    const { rows } = await pool.query(
      `SELECT "teacher_id", "record_date", "time_in", "status" FROM attendance_records WHERE "learner_id" = $1`,
      [learner.learner_id],
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].teacher_id).toBe(teacher.profile.teacher_id)
    expect(asDate(rows[0].record_date)).toBe(todayInSA())
    expect(rows[0].time_in).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('uses the supplied timeIn when given', async () => {
    const res = await post({ learnerId: learner.learner_id, status: 'present', timeIn: '13:45:00' })
    expect(res.status).toBe(201)
    const { rows } = await pool.query('SELECT "time_in" FROM attendance_records')
    expect(rows[0].time_in).toBe('13:45:00')
  })

  it('marks a learner absent with no arrival time', async () => {
    const res = await post({ learnerId: learner.learner_id, status: 'absent' })
    expect(res.status).toBe(201)
    const { rows } = await pool.query('SELECT "status", "time_in" FROM attendance_records')
    expect(rows).toEqual([{ status: 'absent', time_in: null }])
  })

  it('accepts status in any letter case', async () => {
    const res = await post({ learnerId: learner.learner_id, status: 'PRESENT' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('present')
  })

  it('returns a clean 409 (not a 500) for a second mark on the same learner and day', async () => {
    await post({ learnerId: learner.learner_id, status: 'present' })
    const res = await post({ learnerId: learner.learner_id, status: 'present' })

    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Attendance has already been recorded for this learner today')
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM attendance_records')
    expect(rows[0].n).toBe(1)
  })

  it('returns 409 when a learner marked absent is then posted as present (must PATCH instead)', async () => {
    await post({ learnerId: learner.learner_id, status: 'absent' })
    const res = await post({ learnerId: learner.learner_id, status: 'present' })
    expect(res.status).toBe(409)
  })

  it('handles two simultaneous mark-present requests: one 201, one 409, never a 500', async () => {
    const other = await createUser('teacher')
    const results = await Promise.all([
      post({ learnerId: learner.learner_id, status: 'present' }),
      post({ learnerId: learner.learner_id, status: 'present' }, other),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([201, 409])
  })

  it('allows the same learner to be marked again on a different day', async () => {
    await markAttendance(learner, teacher, { recordDate: '2026-01-15' })
    const res = await post({ learnerId: learner.learner_id, status: 'present' })
    expect(res.status).toBe(201)
  })

  it.each([
    ['learnerId', { status: 'present' }],
    ['status', { learnerId: 1 }],
  ])('rejects a missing %s with 400', async (_field, body) => {
    const res = await post(body)
    expect(res.status).toBe(400)
  })

  it.each(['late', '', 'present; DROP TABLE learners'])('rejects status %p with 400', async (status) => {
    const res = await post({ learnerId: learner.learner_id, status })
    expect(res.status).toBe(400)
  })

  it('returns 404 for a learner that does not exist', async () => {
    const res = await post({ learnerId: 999999, status: 'present' })
    expect(res.status).toBe(404)
  })

  it('returns 404 for a class that does not exist', async () => {
    const res = await post({ learnerId: learner.learner_id, classId: 999999, status: 'present' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when the learner is not in the given class', async () => {
    const greenId = await classIdByName('Green')
    const res = await post({ learnerId: learner.learner_id, classId: greenId, status: 'present' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Learner does not belong to this class')
  })

  it('rejects a non-numeric learnerId with 400, not a 500', async () => {
    const res = await post({ learnerId: 'abc', status: 'present' })
    expect(res.status).toBe(400)
    expect(leaksInternals(res.body)).toBe(false)
  })

  it('is refused for a manager (read-only) with 403', async () => {
    const res = await post({ learnerId: learner.learner_id, status: 'present' }, manager)
    expect(res.status).toBe(403)
  })

  it('is refused for a user whose JWT says teacher but who has no teacher profile (403)', async () => {
    const { rows } = await pool.query(
      `INSERT INTO users ("email", "role", "password_hash", "full_name") VALUES ('ghost@test.iylh.org', 'teacher', 'x', 'Ghost')
       RETURNING "user_id"`,
    )
    const { signToken, cookieFor } = await import('../helpers/factory.js')
    const ghost = { cookie: cookieFor(signToken({ userId: rows[0].user_id, role: 'teacher' })) }
    const res = await post({ learnerId: learner.learner_id, status: 'present' }, ghost)
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/attendance/:recordId', () => {
  it('corrects present to absent and clears the arrival time', async () => {
    const record = await markAttendance(learner, teacher)
    const res = await request(app)
      .patch(`/api/attendance/${record.record_id}`)
      .set('Cookie', teacher.cookie)
      .send({ status: 'absent' })

    expect(res.status).toBe(200)
    const { rows } = await pool.query('SELECT "status", "time_in" FROM attendance_records')
    expect(rows).toEqual([{ status: 'absent', time_in: null }])
  })

  it('corrects absent to present and fills an arrival time', async () => {
    const record = await markAttendance(learner, teacher, { status: 'absent' })
    const res = await request(app)
      .patch(`/api/attendance/${record.record_id}`)
      .set('Cookie', teacher.cookie)
      .send({ status: 'present' })
    expect(res.status).toBe(200)
    const { rows } = await pool.query('SELECT "status", "time_in" FROM attendance_records')
    expect(rows[0].status).toBe('present')
    expect(rows[0].time_in).not.toBeNull()
  })

  it('returns 404 for a record that does not exist', async () => {
    const res = await request(app).patch('/api/attendance/999999').set('Cookie', teacher.cookie).send({ status: 'absent' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for a non-numeric record id', async () => {
    const res = await request(app).patch('/api/attendance/abc').set('Cookie', teacher.cookie).send({ status: 'absent' })
    expect(res.status).toBe(400)
  })

  it('returns 400 without a status', async () => {
    const record = await markAttendance(learner, teacher)
    const res = await request(app).patch(`/api/attendance/${record.record_id}`).set('Cookie', teacher.cookie).send({})
    expect(res.status).toBe(400)
  })
})

describe('GET /api/attendance/class/:classId', () => {
  it("returns today's records for teachers and managers", async () => {
    await markAttendance(learner, teacher)
    for (const user of [teacher, manager]) {
      const res = await request(app).get(`/api/attendance/class/${yellowId}`).set('Cookie', user.cookie)
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]).toMatchObject({ learner_id: learner.learner_id, status: 'present' })
    }
  })

  it('filters by ?date=', async () => {
    await markAttendance(learner, teacher, { recordDate: '2026-02-02' })
    const hit = await request(app).get(`/api/attendance/class/${yellowId}?date=2026-02-02`).set('Cookie', manager.cookie)
    const miss = await request(app).get(`/api/attendance/class/${yellowId}?date=2026-02-03`).set('Cookie', manager.cookie)
    expect(hit.body).toHaveLength(1)
    expect(miss.body).toHaveLength(0)
  })

  it('does not include other classes', async () => {
    const greenLearner = await createLearner({ className: 'Green' })
    await markAttendance(greenLearner, teacher)
    const res = await request(app).get(`/api/attendance/class/${yellowId}`).set('Cookie', teacher.cookie)
    expect(res.body).toHaveLength(0)
  })

  it('returns 404 for a class that does not exist and 400 for a non-numeric one', async () => {
    const missing = await request(app).get('/api/attendance/class/999999').set('Cookie', teacher.cookie)
    const bad = await request(app).get('/api/attendance/class/abc').set('Cookie', teacher.cookie)
    expect(missing.status).toBe(404)
    expect(bad.status).toBe(400)
  })
})
