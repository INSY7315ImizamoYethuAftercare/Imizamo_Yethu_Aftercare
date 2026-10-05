// Parent/guardian portal: the child overview, and parents registering the
// people who may collect their child.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { findKeyDeep } from '../helpers/assertions.js'
import { classIdByName, pool, resetDb, withFailingInsert } from '../helpers/db.js'
import { createLearner, createUser, linkGuardian, markAttendance } from '../helpers/factory.js'

const app = await loadApp()

const todayInSA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
const daysAgo = (n) => {
  const d = new Date(`${todayInSA()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

let teacher
let fatima
let otherParent
let aisha
let otherChild

beforeEach(async () => {
  await resetDb()
  teacher = await createUser('teacher', { fullName: 'Thandeka Nkosi', email: 'nkosi@test.iylh.org' })
  fatima = await createUser('guardian', { fullName: 'Fatima Petersen' })
  otherParent = await createUser('guardian', { fullName: 'Grace Ntombela' })
  aisha = await createLearner({ className: 'Yellow', firstName: 'Aisha', lastName: 'Petersen' })
  otherChild = await createLearner({ className: 'Green', firstName: 'Zoe', lastName: 'Ntombela' })
  await linkGuardian(aisha, fatima)
  await linkGuardian(otherChild, otherParent)
  await pool.query('UPDATE school_classes SET "teacher_id" = $1 WHERE "class_id" = $2', [
    teacher.profile.teacher_id, await classIdByName('Yellow'),
  ])
})

const overview = (learner = aisha, user = fatima) =>
  request(app).get(`/api/guardian/children/${learner.learner_id}/overview`).set('Cookie', user.cookie)
const addPickup = (body, learner = aisha, user = fatima) =>
  request(app).post(`/api/guardian/children/${learner.learner_id}/pickups`).set('Cookie', user.cookie).send(body)
const ZAINAB = { fullName: 'Zainab Hendricks', relationship: 'Aunt', contactNumber: '0723456789' }

describe('GET /api/guardian/children/:learnerId/overview', () => {
  it("returns the child's details, class teacher contact and pickup list", async () => {
    const res = await overview()
    expect(res.status).toBe(200)
    expect(res.body.child).toEqual({
      learnerId: aisha.learner_id, firstName: 'Aisha', lastName: 'Petersen', name: 'Aisha Petersen',
      className: 'Yellow', gradeRange: 'Gr 1-2', canWalkHomeAlone: false,
    })
    expect(res.body.teacher).toEqual({ name: 'Thandeka Nkosi', email: 'nkosi@test.iylh.org' })
    expect(res.body.pickups).toEqual([
      { guardianId: fatima.profile.guardian_id, fullName: 'Fatima Petersen', relationship: 'Parent', isPrimaryContact: true, isYou: true },
    ])
  })

  it("never shows other pickups' phone numbers", async () => {
    await addPickup(ZAINAB)
    const res = await overview()
    expect(findKeyDeep(res.body.pickups, /contact_?number|phone|email/i)).toBeNull()
    expect(JSON.stringify(res.body)).not.toContain('0723456789')
  })

  it('shows "not marked yet", then present with arrival time, then who collected them', async () => {
    expect((await overview()).body.today).toMatchObject({ status: null, signedOut: null })

    await markAttendance(aisha, teacher, { timeIn: '13:55:00' })
    expect((await overview()).body.today).toMatchObject({ status: 'present', timeIn: '13:55', signedOut: null })

    await request(app).post('/api/signout/confirm').set('Cookie', teacher.cookie)
      .send({ learnerId: aisha.learner_id, guardianId: fatima.profile.guardian_id })
    const today = (await overview()).body.today
    expect(today.signedOut).toEqual({ timeOut: expect.stringMatching(/^\d{2}:\d{2}$/), collectedBy: 'Fatima Petersen' })
  })

  it('works out attendance over the last 30 days and lists the last 7', async () => {
    await markAttendance(aisha, teacher, { recordDate: daysAgo(1) })
    await markAttendance(aisha, teacher, { recordDate: daysAgo(2), status: 'absent' })
    await markAttendance(aisha, teacher, { recordDate: daysAgo(10) })
    await markAttendance(aisha, teacher, { recordDate: daysAgo(40), status: 'absent' }) // outside 30 days
    await pool.query(
      `INSERT INTO sign_out_records ("learner_id", "teacher_id", "guardian_id", "record_date", "time_out") VALUES ($1, $2, $3, $4, '17:15:00')`,
      [aisha.learner_id, teacher.profile.teacher_id, fatima.profile.guardian_id, daysAgo(1)],
    )

    const res = await overview()
    expect(res.body.attendance).toEqual({ periodDays: 30, presentDays: 2, markedDays: 3, percent: 67 })
    expect(res.body.week).toEqual([
      { date: daysAgo(1), status: 'present', signedOut: { timeOut: '17:15', collectedBy: 'Fatima Petersen' } },
      { date: daysAgo(2), status: 'absent', signedOut: null },
    ])
  })

  it('has no percentage before any attendance is marked', async () => {
    expect((await overview()).body.attendance).toMatchObject({ markedDays: 0, percent: null })
  })

  it("lists observations newest first, with the teacher's name", async () => {
    const insert = (date, category, notes) =>
      pool.query(
        `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating", "notes")
         VALUES ($1, $2, $3, $4, 7, $5)`,
        [aisha.learner_id, teacher.profile.teacher_id, date, category, notes],
      )
    await insert('2026-07-10', 'Reading', 'Reading short sentences.')
    await insert('2026-07-15', 'Social', 'Showed great leadership.')
    const res = await overview()
    expect(res.body.observations).toEqual([
      { observationId: expect.any(Number), date: '2026-07-15', category: 'Social', rating: 7, notes: 'Showed great leadership.', teacherName: 'Thandeka Nkosi' },
      { observationId: expect.any(Number), date: '2026-07-10', category: 'Reading', rating: 7, notes: 'Reading short sentences.', teacherName: 'Thandeka Nkosi' },
    ])
  })

  it("refuses another family's child (403) and a bad id (400)", async () => {
    expect((await overview(otherChild)).status).toBe(403)
    expect((await request(app).get('/api/guardian/children/abc/overview').set('Cookie', fatima.cookie)).status).toBe(400)
  })
})

describe('POST /api/guardian/children/:learnerId/pickups', () => {
  it('adds a pickup person without an account, authorised straight away', async () => {
    const res = await addPickup(ZAINAB)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      guardianId: expect.any(Number), fullName: 'Zainab Hendricks', relationship: 'Aunt', isPrimaryContact: false, isYou: false,
    })

    const { rows: [person] } = await pool.query('SELECT "user_id", "contact_number" FROM guardians WHERE "guardian_id" = $1', [res.body.guardianId])
    expect(person).toEqual({ user_id: null, contact_number: '0723456789' })
    const { rows: [perm] } = await pool.query('SELECT "added_by_guardian_id" FROM pickup_permissions WHERE "guardian_id" = $1', [res.body.guardianId])
    expect(perm.added_by_guardian_id).toBe(fatima.profile.guardian_id)

    expect((await overview()).body.pickups.map((p) => p.fullName)).toEqual(['Fatima Petersen', 'Zainab Hendricks'])
  })

  it('lets a teacher sign the child out to the new person', async () => {
    const zainab = (await addPickup(ZAINAB)).body
    await markAttendance(aisha, teacher)
    const list = await request(app).get('/api/signout/today').set('Cookie', teacher.cookie)
    expect(list.body.learners[0].pickups.map((p) => p.fullName)).toContain('Zainab Hendricks')
    const res = await request(app).post('/api/signout/confirm').set('Cookie', teacher.cookie)
      .send({ learnerId: aisha.learner_id, guardianId: zainab.guardianId })
    expect(res.status).toBe(201)
    expect((await overview()).body.today.signedOut.collectedBy).toBe('Zainab Hendricks')
  })

  it('records permission to walk home alone when ticked', async () => {
    await addPickup({ ...ZAINAB, canWalkHomeAlone: true })
    expect((await overview()).body.child.canWalkHomeAlone).toBe(true)
  })

  it('refuses someone already on the list (any letter case) with 409', async () => {
    await addPickup(ZAINAB)
    const res = await addPickup({ ...ZAINAB, fullName: '  zainab HENDRICKS ' })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/already on the pickup list/)
  })

  it.each([
    [{ fullName: '' }, 'fullName'],
    [{ relationship: undefined }, 'relationship'],
    [{ contactNumber: undefined }, 'contactNumber'],
    [{ fullName: 'x'.repeat(151) }, 'fullName'],
  ])('rejects %o with 400', async (change, field) => {
    const res = await addPickup({ ...ZAINAB, ...change })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(field)
  })

  it("refuses to add a pickup for another family's child, and saves nothing", async () => {
    const res = await addPickup(ZAINAB, otherChild)
    expect(res.status).toBe(403)
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM guardians WHERE "full_name" = 'Zainab Hendricks'`)
    expect(rows[0].n).toBe(0)
  })

  it('saves nothing if part of it fails (transaction)', async () => {
    const res = await withFailingInsert('pickup_permissions', 'simulated failure', () => addPickup(ZAINAB))
    expect(res.status).toBe(500)
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM guardians WHERE "full_name" = 'Zainab Hendricks'`)
    expect(rows[0].n).toBe(0)
  })
})
