// #51 — Digital sign-out: guardian verification and confirmation.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { findKeyDeep } from '../helpers/assertions.js'
import { pool, resetDb } from '../helpers/db.js'
import { cookieFor, createLearner, createUser, linkGuardian, markAttendance, signToken } from '../helpers/factory.js'

const app = await loadApp()

let teacher
let guardian
let stranger
let learner

beforeEach(async () => {
  await resetDb()
  teacher = await createUser('teacher')
  guardian = await createUser('guardian', { fullName: 'Fatima Petersen' })
  stranger = await createUser('guardian', { fullName: 'Not A Relative' })
  learner = await createLearner({ firstName: 'Aisha', lastName: 'Petersen', canWalkHomeAlone: false })
  await linkGuardian(learner, guardian)
})

const verify = (body, user = teacher) => request(app).post('/api/signout/verify').set('Cookie', user.cookie).send(body)
const confirm = (body, user = teacher) => request(app).post('/api/signout/confirm').set('Cookie', user.cookie).send(body)
const signOutCount = async () => (await pool.query('SELECT COUNT(*)::int AS n FROM sign_out_records')).rows[0].n

describe('POST /api/signout/verify', () => {
  it('reports an authorised guardian, with the walk-home-alone flag', async () => {
    const res = await verify({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ authorised: true, canWalkHomeAlone: false })
  })

  it('reports an unauthorised person without writing anything', async () => {
    const res = await verify({ learnerId: learner.learner_id, guardianId: stranger.profile.guardian_id })
    expect(res.status).toBe(200)
    expect(res.body.authorised).toBe(false)
    expect(res.body.message).toMatch(/Escalate to the manager/)
    expect(await signOutCount()).toBe(0)
  })

  it('returns 404 for a learner that does not exist', async () => {
    const res = await verify({ learnerId: 999999, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(404)
  })

  it('returns 400 when learnerId or guardianId is missing', async () => {
    expect((await verify({ learnerId: learner.learner_id })).status).toBe(400)
    expect((await verify({ guardianId: guardian.profile.guardian_id })).status).toBe(400)
  })

  it('does not authorise a guardian whose account has been deactivated', async () => {
    await pool.query('UPDATE users SET "is_active" = false WHERE "user_id" = $1', [guardian.user.user_id])
    const res = await verify({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.body.authorised).toBe(false)
  })
})

describe('POST /api/signout/confirm', () => {
  it('records the collection by an authorised guardian (201)', async () => {
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      learner_id: learner.learner_id,
      guardian_id: guardian.profile.guardian_id,
      teacher_id: teacher.profile.teacher_id,
    })
    expect(res.body.time_out).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    expect(await signOutCount()).toBe(1)
  })

  it('refuses a guardian who is not on the pickup list (403) and writes nothing', async () => {
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: stranger.profile.guardian_id })
    expect(res.status).toBe(403)
    expect(await signOutCount()).toBe(0)
  })

  it("refuses another family's guardian even when they are authorised for a different child", async () => {
    const otherChild = await createLearner({ firstName: 'Zoe', lastName: 'Other' })
    await linkGuardian(otherChild, stranger)
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: stranger.profile.guardian_id })
    expect(res.status).toBe(403)
  })

  it('refuses a guardian id that does not exist (403)', async () => {
    const res = await confirm({ learnerId: learner.learner_id, guardianId: 999999 })
    expect(res.status).toBe(403)
    expect(await signOutCount()).toBe(0)
  })

  it.each(['guardian', 'admin_standard'])('cannot be performed by a %s (403)', async (role) => {
    const user = role === 'guardian' ? guardian : await createUser(role)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id }, user)
    expect(res.status).toBe(403)
    expect(await signOutCount()).toBe(0)
  })

  it('can be performed by a manager, recorded against the manager', async () => {
    const manager = await createUser('manager')
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id }, manager)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ manager_id: manager.profile.manager_id, teacher_id: null })
  })

  it('can be performed by the master admin, recorded against their manager profile', async () => {
    const master = await createUser('admin_master')
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id }, master)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ manager_id: master.profile.manager_id, teacher_id: null })
  })

  it('applies the same rules to a manager (unauthorised guardian -> 403)', async () => {
    const manager = await createUser('manager')
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: stranger.profile.guardian_id }, manager)
    expect(res.status).toBe(403)
  })

  it('returns 400 when learnerId or guardianId is missing', async () => {
    expect((await confirm({ learnerId: learner.learner_id })).status).toBe(400)
    expect((await confirm({ guardianId: guardian.profile.guardian_id })).status).toBe(400)
  })

  it('refuses to sign out a learner who was not marked present today (409)', async () => {
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/has not been marked present today/)
    expect(await signOutCount()).toBe(0)
  })

  it('refuses to sign out a learner who was marked absent today (409)', async () => {
    await markAttendance(learner, teacher, { status: 'absent' })
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/marked absent today/)
    expect(await signOutCount()).toBe(0)
  })

  it('only counts a present mark from today, not an earlier day', async () => {
    await markAttendance(learner, teacher, { recordDate: '2026-01-15' })
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(409)
  })

  it('allows the sign-out once the register is corrected from absent to present', async () => {
    const record = await markAttendance(learner, teacher, { status: 'absent' })
    await request(app).patch(`/api/attendance/${record.record_id}`).set('Cookie', teacher.cookie).send({ status: 'present' })
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(201)
  })

  it('still answers 403 (not 409) for an unauthorised guardian when the learner is absent', async () => {
    const res = await confirm({ learnerId: learner.learner_id, guardianId: stranger.profile.guardian_id })
    expect(res.status).toBe(403)
  })

  it('refuses a second sign-out for the same learner on the same day (409)', async () => {
    await markAttendance(learner, teacher)
    await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/already signed out today at \d{2}:\d{2}/)
    expect(await signOutCount()).toBe(1)
  })

  it('refuses a second sign-out even by a different authorised guardian', async () => {
    const dad = await createUser('guardian', { fullName: 'Ahmed Petersen' })
    await linkGuardian(learner, dad, { isPrimaryContact: false })
    await markAttendance(learner, teacher)
    await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    const res = await confirm({ learnerId: learner.learner_id, guardianId: dad.profile.guardian_id })
    expect(res.status).toBe(409)
    expect(await signOutCount()).toBe(1)
  })

  it('does not count a sign-out from an earlier day', async () => {
    await markAttendance(learner, teacher)
    await pool.query(
      `INSERT INTO sign_out_records ("learner_id", "teacher_id", "guardian_id", "record_date", "time_out")
       VALUES ($1, $2, $3, '2026-01-15', '16:00:00')`,
      [learner.learner_id, teacher.profile.teacher_id, guardian.profile.guardian_id],
    )
    const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect(res.status).toBe(201)
  })

  describe('just after midnight in South Africa (22:00-24:00 UTC)', () => {
    afterEach(() => jest.useRealTimers())

    it('dates and times the sign-out in SA time, matching the attendance record', async () => {
      jest.useFakeTimers({ now: new Date('2026-10-05T22:30:00Z'), advanceTimers: true }) // 00:30 SAST on 6 Oct
      await markAttendance(learner, teacher, { recordDate: '2026-10-06' })
      // Re-sign after moving the clock, or the token would already be expired.
      const freshTeacher = { cookie: cookieFor(signToken({ userId: teacher.user.user_id, role: 'teacher' })) }
      const res = await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id }, freshTeacher)
      expect(res.status).toBe(201)
      const { rows } = await pool.query(`SELECT "record_date"::text AS d, "time_out"::text AS t FROM sign_out_records`)
      expect(rows[0].d).toBe('2026-10-06')
      expect(rows[0].t).toMatch(/^00:3\d:\d\d$/)
    })
  })
})

describe('walking home alone (guardianId: null)', () => {
  it('signs out a learner who may walk home alone, with no guardian', async () => {
    const walker = await createLearner({ firstName: 'Bongani', canWalkHomeAlone: true })
    await markAttendance(walker, teacher)
    const res = await confirm({ learnerId: walker.learner_id, guardianId: null })
    expect(res.status).toBe(201)
    expect(res.body.guardian_id).toBeNull()
  })

  it('refuses a learner who is not allowed to walk home alone (403)', async () => {
    await markAttendance(learner, teacher)
    const res = await confirm({ learnerId: learner.learner_id, guardianId: null })
    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/not allowed to walk home alone/)
    expect(await signOutCount()).toBe(0)
  })

  it('still requires a present mark today', async () => {
    const walker = await createLearner({ canWalkHomeAlone: true })
    const res = await confirm({ learnerId: walker.learner_id, guardianId: null })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown learner', async () => {
    const res = await confirm({ learnerId: 999999, guardianId: null })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/signout/today', () => {
  const today = (user = teacher) => request(app).get('/api/signout/today').set('Cookie', user.cookie)

  it("lists today's present learners with their active pickups, and who has gone", async () => {
    const dad = await createUser('guardian', { fullName: 'Ahmed Petersen' })
    const exDad = await createUser('guardian', { fullName: 'Deactivated Dad', isActive: false })
    await linkGuardian(learner, dad, { isPrimaryContact: false })
    await linkGuardian(learner, exDad, { isPrimaryContact: false })
    const walker = await createLearner({ firstName: 'Bongani', lastName: 'Khumalo', canWalkHomeAlone: true })
    const absent = await createLearner({ firstName: 'Amahle' })
    const notMarked = await createLearner({ firstName: 'Liam' })
    await markAttendance(learner, teacher)
    await markAttendance(walker, teacher)
    await markAttendance(absent, teacher, { status: 'absent' })
    await confirm({ learnerId: walker.learner_id, guardianId: null })

    const res = await today()
    expect(res.status).toBe(200)
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const names = res.body.learners.map((l) => l.name)
    expect(names).toEqual(expect.arrayContaining(['Aisha Petersen', 'Bongani Khumalo']))
    expect(names).not.toContain(`Amahle ${absent.last_name}`)
    expect(names).not.toContain(`Liam ${notMarked.last_name}`)

    const aisha = res.body.learners.find((l) => l.name === 'Aisha Petersen')
    expect(aisha).toMatchObject({ learnerId: learner.learner_id, className: 'Yellow', canWalkHomeAlone: false, signedOut: null })
    expect(aisha.pickups).toEqual([
      { guardianId: guardian.profile.guardian_id, fullName: 'Fatima Petersen', relationship: 'Parent', isPrimaryContact: true },
      { guardianId: dad.profile.guardian_id, fullName: 'Ahmed Petersen', relationship: 'Parent', isPrimaryContact: false },
    ])
    const bongani = res.body.learners.find((l) => l.name === 'Bongani Khumalo')
    expect(bongani.signedOut).toEqual({ timeOut: expect.stringMatching(/^\d{2}:\d{2}$/), collectedBy: 'Walked home alone' })
  })

  it('shows the guardian who collected', async () => {
    await markAttendance(learner, teacher)
    await confirm({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    const res = await today()
    expect(res.body.learners[0].signedOut.collectedBy).toBe('Fatima Petersen')
  })

  it('never includes guardian contact numbers or emails (POPIA)', async () => {
    await markAttendance(learner, teacher)
    const res = await today()
    expect(findKeyDeep(res.body, /contact_?number|phone|email/i)).toBeNull()
    expect(JSON.stringify(res.body)).not.toMatch(/0820000000|@test.iylh.org/)
  })

  it('is empty before attendance is taken', async () => {
    const res = await today()
    expect(res.body.learners).toEqual([])
  })

  it('is open to managers and the master admin, closed to guardians and standard admins', async () => {
    expect((await today(await createUser('manager'))).status).toBe(200)
    expect((await today(await createUser('admin_master'))).status).toBe(200)
    expect((await today(guardian)).status).toBe(403)
    expect((await today(await createUser('admin_standard'))).status).toBe(403)
  })
})
