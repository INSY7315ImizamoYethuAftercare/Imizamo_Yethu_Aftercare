// Input validation and injection: hostile strings are data, bad shapes are 4xx.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { leaksInternals } from '../helpers/assertions.js'
import { classIdByName, pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser, markAttendance } from '../helpers/factory.js'

const app = await loadApp()

const INJECTIONS = [
  "1' OR '1'='1",
  '1; DROP TABLE learners; --',
  "1) UNION SELECT password_hash FROM users --",
  '1%27%20OR%201=1',
]

let manager
let teacher
let yellowId

beforeEach(async () => {
  await resetDb()
  manager = await createUser('manager')
  teacher = await createUser('teacher')
  yellowId = await classIdByName('Yellow')
})

const tablesStillThere = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('learners', 'users')`,
  )
  return rows[0].n === 2
}

describe('SQL injection in URL params', () => {
  it.each(INJECTIONS)('GET /api/classes/:classId with %p is a clean 4xx', async (payload) => {
    const res = await request(app).get(`/api/classes/${encodeURIComponent(payload)}`).set('Cookie', manager.cookie)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
    expect(await tablesStillThere()).toBe(true)
  })

  it.each(INJECTIONS)('GET /api/attendance/class/:classId with %p is a clean 4xx', async (payload) => {
    const res = await request(app)
      .get(`/api/attendance/class/${encodeURIComponent(payload)}`)
      .set('Cookie', teacher.cookie)
    expect(res.status).toBe(400)
  })

  it.each(INJECTIONS)('PATCH /api/attendance/:recordId with %p is a clean 400', async (payload) => {
    const res = await request(app)
      .patch(`/api/attendance/${encodeURIComponent(payload)}`)
      .set('Cookie', teacher.cookie)
      .send({ status: 'absent' })
    expect(res.status).toBe(400)
  })

  it('GET /api/observations/learner/:learnerId with injection text is a clean 4xx', async () => {
    const res = await request(app)
      .get(`/api/observations/learner/${encodeURIComponent(INJECTIONS[0])}`)
      .set('Cookie', teacher.cookie)
    expect(res.status).toBeLessThan(500)
  })
})

describe('SQL injection in bodies and query strings', () => {
  it('stores a hostile learner name verbatim and leaves the schema intact', async () => {
    const name = "Robert'); DROP TABLE learners; --"
    const res = await request(app)
      .post('/api/learners')
      .set('Cookie', manager.cookie)
      .send({ classId: yellowId, firstName: name, lastName: "O'Brien" })
    expect(res.status).toBe(201)
    expect(res.body.first_name).toBe(name)
    expect(await tablesStillThere()).toBe(true)
    const { rows } = await pool.query('SELECT "first_name", "last_name" FROM learners')
    expect(rows).toEqual([{ first_name: name, last_name: "O'Brien" }])
  })

  it('treats an injection attempt in the login email as a failed login', async () => {
    await createUser('teacher', { email: 'real@test.iylh.org' })
    const res = await request(app).post('/api/auth/login').send({ email: "' OR '1'='1' --", password: "' OR '1'='1" })
    expect(res.status).toBe(401)
  })

  it.each(["2026-01-01' OR '1'='1", '2026-13-45', 'yesterday'])(
    'GET /api/reports/donor rejects periodStart=%p with 400',
    async (bad) => {
      const res = await request(app)
        .get('/api/reports/donor')
        .query({ periodStart: bad, periodEnd: '2026-12-31' })
        .set('Cookie', manager.cookie)
      expect(res.status).toBe(400)
    },
  )

  it("GET /api/attendance/class/:classId?date=<injection> is a 400, not a 500", async () => {
    const res = await request(app)
      .get(`/api/attendance/class/${yellowId}`)
      .query({ date: "2026-01-01' OR '1'='1" })
      .set('Cookie', manager.cookie)
    expect(res.status).toBe(400)
    expect(leaksInternals(res.body)).toBe(false)
  })
})

describe('oversized and malformed payloads', () => {
  it('rejects a JSON body over the 100kb default limit with 413', async () => {
    const res = await request(app)
      .post('/api/learners')
      .set('Cookie', manager.cookie)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ classId: yellowId, firstName: 'x'.repeat(200 * 1024), lastName: 'Big' }))
    expect(res.status).toBe(413)
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM learners')
    expect(rows[0].n).toBe(0)
  })

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "a@b.c", "password": ')
    expect(res.status).toBe(400)
  })

  it('rejects a name longer than the column allows with a 4xx, not a 500', async () => {
    const res = await request(app)
      .post('/api/learners')
      .set('Cookie', manager.cookie)
      .send({ classId: yellowId, firstName: 'x'.repeat(500), lastName: 'Long' })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })
})

describe('wrong-type payloads', () => {
  it('rejects a string rating on observations with 400', async () => {
    const l = await createLearner()
    const res = await request(app)
      .post('/api/observations')
      .set('Cookie', teacher.cookie)
      .send({ learnerId: l.learner_id, category: 'Social', rating: '7' })
    expect(res.status).toBe(400)
  })

  it('rejects an out-of-range rating with 400', async () => {
    const l = await createLearner()
    const res = await request(app)
      .post('/api/observations')
      .set('Cookie', teacher.cookie)
      .send({ learnerId: l.learner_id, category: 'Social', rating: 11 })
    expect(res.status).toBe(400)
  })

  it('rejects an array status on attendance with 400', async () => {
    const l = await createLearner()
    const res = await request(app).post('/api/attendance').set('Cookie', teacher.cookie).send({ learnerId: l.learner_id, status: ['present'] })
    expect(res.status).toBe(400)
  })

  it('rejects a non-numeric classId when creating a learner with 400', async () => {
    const res = await request(app).post('/api/learners').set('Cookie', manager.cookie).send({ classId: 'abc', firstName: 'A', lastName: 'B' })
    expect(res.status).toBe(400)
  })

  it('does not turn canWalkHomeAlone: "false" into true', async () => {
    const res = await request(app)
      .post('/api/learners')
      .set('Cookie', manager.cookie)
      .send({ classId: yellowId, firstName: 'Safe', lastName: 'Child', canWalkHomeAlone: 'false' })
    expect(res.status === 400 || res.body.can_walk_home_alone === false).toBe(true)
  })

  it('PATCH /api/observations/:id with notes updates the notes', async () => {
    const l = await createLearner()
    const { rows: [o] } = await pool.query(
      `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating")
       VALUES ($1, $2, CURRENT_DATE, 'Social', 5) RETURNING "observation_id"`,
      [l.learner_id, teacher.profile.teacher_id],
    )
    const res = await request(app)
      .patch(`/api/observations/${o.observation_id}`)
      .set('Cookie', teacher.cookie)
      .send({ notes: 'Much more confident this week' })
    expect(res.status).toBe(200)
    expect(res.body.notes).toBe('Much more confident this week')
  })

  it('PATCH /api/observations/:id with only a rating keeps the category', async () => {
    const l = await createLearner()
    const { rows: [o] } = await pool.query(
      `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating")
       VALUES ($1, $2, CURRENT_DATE, 'Social', 5) RETURNING "observation_id"`,
      [l.learner_id, teacher.profile.teacher_id],
    )
    const res = await request(app).patch(`/api/observations/${o.observation_id}`).set('Cookie', teacher.cookie).send({ rating: 9 })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ rating: 9, category: 'Social' })
  })

  it('PATCH /api/observations/:id rejects rating 0 with 400', async () => {
    const l = await createLearner()
    await markAttendance(l, teacher)
    const { rows: [o] } = await pool.query(
      `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating")
       VALUES ($1, $2, CURRENT_DATE, 'Social', 5) RETURNING "observation_id"`,
      [l.learner_id, teacher.profile.teacher_id],
    )
    const res = await request(app).patch(`/api/observations/${o.observation_id}`).set('Cookie', teacher.cookie).send({ category: 'Social', rating: 0 })
    expect(res.status).toBe(400)
  })
})

describe('requests with no JSON body', () => {
  it.each([
    ['post', '/api/auth/login', null],
    ['post', '/api/auth/register', null],
    ['post', '/api/attendance', 'teacher'],
    ['post', '/api/learners', 'manager'],
    ['post', '/api/signout/confirm', 'teacher'],
    ['post', '/api/observations', 'teacher'],
    ['post', '/api/classes', 'manager'],
    ['post', '/api/teacher', 'manager'],
  ])('%s %s answers 400, not 500', async (method, path, who) => {
    let req = request(app)[method](path)
    if (who) req = req.set('Cookie', (who === 'teacher' ? teacher : manager).cookie)
    const res = await req
    expect(res.status).toBe(400)
  })
})

describe('field formats', () => {
  it.each(['2026-02-30', '14/03/2018', 'soon'])('rejects dateOfBirth %p with 400', async (dateOfBirth) => {
    const res = await request(app).post('/api/learners').set('Cookie', manager.cookie)
      .send({ classId: yellowId, firstName: 'A', lastName: 'B', dateOfBirth })
    expect(res.status).toBe(400)
  })

  it('accepts a real dateOfBirth, and null clears it on update', async () => {
    const created = await request(app).post('/api/learners').set('Cookie', manager.cookie)
      .send({ classId: yellowId, firstName: 'A', lastName: 'B', dateOfBirth: '2024-02-29' })
    expect(created.status).toBe(201)
    const cleared = await request(app).patch(`/api/learners/${created.body.learner_id}`).set('Cookie', manager.cookie)
      .send({ dateOfBirth: null })
    expect(cleared.status).toBe(200)
    expect(cleared.body.date_of_birth).toBeNull()
  })

  it('does not turn isActive: "false" into an active learner', async () => {
    const l = await createLearner()
    const res = await request(app).patch(`/api/learners/${l.learner_id}`).set('Cookie', manager.cookie).send({ isActive: 'false' })
    expect(res.status).toBe(200)
    expect(res.body.is_active).toBe(false)
  })

  it.each(['noon', '25:00', '14:60:00'])('rejects timeIn %p with 400', async (timeIn) => {
    const l = await createLearner()
    const res = await request(app).post('/api/attendance').set('Cookie', teacher.cookie)
      .send({ learnerId: l.learner_id, status: 'present', timeIn })
    expect(res.status).toBe(400)
  })

  it('rejects a non-numeric teacherId when assigning a class teacher, but null unassigns', async () => {
    const bad = await request(app).patch(`/api/classes/${yellowId}`).set('Cookie', manager.cookie).send({ teacherId: 'abc' })
    expect(bad.status).toBe(400)
    const ok = await request(app).patch(`/api/classes/${yellowId}`).set('Cookie', manager.cookie).send({ teacherId: null })
    expect(ok.status).toBe(200)
    expect(ok.body.teacher_id).toBeNull()
  })

  it.each([
    ['guardian', '/api/guardian/abc/deactivate'],
    ['teacher', '/api/teacher/abc/deactivate'],
  ])('rejects a non-numeric %s id with 400', async (_who, path) => {
    const res = await request(app).patch(path).set('Cookie', manager.cookie)
    expect(res.status).toBe(400)
  })

  it('rejects observation notes over 2000 characters', async () => {
    const l = await createLearner()
    const res = await request(app).post('/api/observations').set('Cookie', teacher.cookie)
      .send({ learnerId: l.learner_id, category: 'Social', rating: 5, notes: 'x'.repeat(2001) })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email when a manager creates a teacher', async () => {
    const res = await request(app).post('/api/teacher').set('Cookie', manager.cookie)
      .send({ email: 'not-an-email', password: 'Long-enough-1', fullName: 'T' })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid claimedLearnerDob at registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'p@test.iylh.org', password: 'Long-enough-1', role: 'guardian', fullName: 'P',
      contactNumber: '082', relationship: 'Mother', claimedLearnerName: 'A B', claimedLearnerDob: '2018-13-01',
    })
    expect(res.status).toBe(400)
  })
})
