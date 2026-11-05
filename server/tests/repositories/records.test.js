// Repository layer against imizamo_test: learners, classes, attendance,
// observations, pickup permissions, sign-outs, reports, and FK behaviour.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import AttendanceRepository from '../../src/repositories/AttendanceRepository.js'
import LearnerRepository from '../../src/repositories/LearnerRepository.js'
import ObservationRepository from '../../src/repositories/ObservationRepository.js'
import PickupPermissionRepository from '../../src/repositories/PickupPermissionRepository.js'
import ReportRepository from '../../src/repositories/ReportRepository.js'
import SchoolClassRepository from '../../src/repositories/SchoolClassRepository.js'
import SignOutRepository from '../../src/repositories/SignOutRepository.js'
import { loadApp } from '../helpers/app.js'
import { classIdByName, pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser, linkGuardian, markAttendance } from '../helpers/factory.js'

const app = await loadApp()

const learners = new LearnerRepository(pool)
const classes = new SchoolClassRepository(pool)
const attendance = new AttendanceRepository(pool)
const observations = new ObservationRepository(pool)
const pickups = new PickupPermissionRepository(pool)
const signOuts = new SignOutRepository(pool)
const reports = new ReportRepository(pool)

let teacher
let guardian
let yellowId

beforeEach(async () => {
  await resetDb()
  teacher = await createUser('teacher')
  guardian = await createUser('guardian')
  yellowId = await classIdByName('Yellow')
})

describe('LearnerRepository', () => {
  it('creates and finds a learner (with class name)', async () => {
    const l = await learners.create({
      classId: yellowId, firstName: 'Aisha', lastName: 'Petersen', dateOfBirth: '2018-03-14', canWalkHomeAlone: false,
    })
    expect(l).toMatchObject({ first_name: 'Aisha', class_id: yellowId, is_active: true })
    expect(await learners.findById(l.learner_id)).toMatchObject({ learner_id: l.learner_id, first_name: 'Aisha' })
    expect(await learners.findById(999999)).toBeNull()
  })

  it('allows a learner without a date of birth', async () => {
    const l = await learners.create({ classId: yellowId, firstName: 'No', lastName: 'Dob', dateOfBirth: null, canWalkHomeAlone: false })
    expect(l.date_of_birth).toBeNull()
  })

  it('rejects a learner in a class that does not exist (23503)', async () => {
    await expect(
      learners.create({ classId: 999999, firstName: 'X', lastName: 'Y', dateOfBirth: null, canWalkHomeAlone: false }),
    ).rejects.toMatchObject({ code: '23503' })
  })

  it('findByGuardianId returns only that guardian\'s children', async () => {
    const mine = await createLearner()
    await createLearner()
    await linkGuardian(mine, guardian)
    const kids = await learners.findByGuardianId(guardian.profile.guardian_id)
    expect(kids.map((k) => k.learner_id)).toEqual([mine.learner_id])
  })

  it('findAll lists everyone; findByClassId and countActiveByClassId only active learners in the class', async () => {
    const a = await createLearner({ className: 'Yellow' })
    const b = await createLearner({ className: 'Yellow' })
    await createLearner({ className: 'Green' })
    await learners.update(a.learner_id, { is_active: false })
    expect(await learners.findAll()).toHaveLength(3)
    expect((await learners.findByClassId(yellowId)).map((l) => l.learner_id)).toEqual([b.learner_id])
    expect(Number(await learners.countActiveByClassId(yellowId))).toBe(1)
  })

  it('findByFullNameAndDob matches case-insensitively and ignores outer spaces', async () => {
    const l = await createLearner({ firstName: 'Aisha', lastName: 'Petersen', dateOfBirth: '2018-03-14' })
    expect(await learners.findByFullNameAndDob('  aisha PETERSEN ', '2018-03-14')).toMatchObject({ learner_id: l.learner_id })
    expect(await learners.findByFullNameAndDob('Aisha Petersen', '2018-03-15')).toBeNull()
  })

  it('update changes whitelisted fields only and returns null for unknown ids', async () => {
    const l = await createLearner()
    const res = await learners.update(l.learner_id, { can_walk_home_alone: true, learner_id: 5 })
    expect(res).toMatchObject({ learner_id: l.learner_id, can_walk_home_alone: true })
    expect(await learners.update(999999, { first_name: 'X' })).toBeNull()
  })

  it('delete removes the learner and cascades their history', async () => {
    const l = await createLearner()
    await linkGuardian(l, guardian)
    await markAttendance(l, teacher)
    expect(await learners.delete(l.learner_id)).toBeTruthy()
    const { rows } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM attendance_records)::int AS a, (SELECT COUNT(*) FROM pickup_permissions)::int AS p`,
    )
    expect(rows[0]).toEqual({ a: 0, p: 0 })
    expect(await learners.delete(l.learner_id)).toBeFalsy()
  })
})

describe('SchoolClassRepository', () => {
  it('findAll hides inactive classes unless asked', async () => {
    await classes.setActive(await classIdByName('Orange'), false)
    expect(await classes.findAll()).toHaveLength(4)
    expect(await classes.findAll({ includeInactive: true })).toHaveLength(5)
  })

  it('creates a class with no teacher and enforces one active class per name, case-insensitively (23505)', async () => {
    const c = await classes.create({ teacherId: null, className: 'Purple', gradeRange: 'Gr 1' })
    expect(c).toMatchObject({ class_name: 'Purple', teacher_id: null, is_active: true })
    await expect(classes.create({ teacherId: null, className: 'purple', gradeRange: 'Gr 2' })).rejects.toMatchObject({
      code: '23505',
    })
  })

  it('allows reusing the name of a deactivated class', async () => {
    await classes.setActive(await classIdByName('Orange'), false)
    await expect(classes.create({ teacherId: null, className: 'Orange', gradeRange: 'Gr R' })).resolves.toBeTruthy()
  })

  it('assigns a teacher via update and finds classes by teacher', async () => {
    await classes.update(yellowId, { teacher_id: teacher.profile.teacher_id, class_id: 999 })
    const mine = await classes.findByTeacherId(teacher.profile.teacher_id)
    expect(mine.map((c) => c.class_id)).toEqual([yellowId])
    expect(await classes.findById(999999)).toBeNull()
  })
})

describe('AttendanceRepository', () => {
  it('marks present/absent and refuses a second record for the same learner and day (23505)', async () => {
    const l = await createLearner()
    const p = await attendance.markPresent({ learnerId: l.learner_id, teacherId: teacher.profile.teacher_id, recordDate: '2026-03-02', timeIn: '14:00:00' })
    expect(p).toMatchObject({ status: 'present' })
    await expect(
      attendance.markAbsent({ learnerId: l.learner_id, teacherId: teacher.profile.teacher_id, recordDate: '2026-03-02' }),
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('rejects a status other than present/absent at the database (23514)', async () => {
    const l = await createLearner()
    await expect(
      pool.query(
        `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "status") VALUES ($1, $2, CURRENT_DATE, 'late')`,
        [l.learner_id, teacher.profile.teacher_id],
      ),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('updateStatus, findById, findByLearnerId and findByClassAndDate', async () => {
    const l = await createLearner()
    const r = await markAttendance(l, teacher, { recordDate: '2026-03-02' })
    await attendance.updateStatus({ recordId: r.record_id, status: 'absent', timeIn: null, teacherId: teacher.profile.teacher_id })
    expect(await attendance.findById(r.record_id)).toMatchObject({ status: 'absent', time_in: null })
    expect(await attendance.findByLearnerId(l.learner_id)).toHaveLength(1)
    expect(await attendance.findByClassAndDate(yellowId, '2026-03-02')).toHaveLength(1)
    expect(await attendance.findByClassAndDate(yellowId, '2026-03-03')).toHaveLength(0)
  })

  it('aggregates by date range without identifying learners', async () => {
    const a = await createLearner()
    const b = await createLearner()
    await markAttendance(a, teacher, { recordDate: '2026-03-02' })
    await markAttendance(b, teacher, { recordDate: '2026-03-02', status: 'absent' })
    await markAttendance(a, teacher, { recordDate: '2026-04-01' })
    const agg = await attendance.getAggregateByDateRange('2026-03-01', '2026-03-31')
    expect(agg).toEqual({ total_present: '1', total_absent: '1', unique_learners: '2', attended_learners: '1' })
  })
})

describe('ObservationRepository', () => {
  const add = (learner, overrides = {}) =>
    observations.create({
      learnerId: learner.learner_id, teacherId: teacher.profile.teacher_id, recordDate: '2026-03-02',
      category: 'Social', rating: 7, notes: 'Shares well', ...overrides,
    })

  it('creates, updates (whitelist only) and deletes', async () => {
    const l = await createLearner()
    const o = await add(l)
    const updated = await observations.update(o.observation_id, { rating: 9, teacher_id: 999999 })
    expect(updated).toMatchObject({ rating: 9, teacher_id: teacher.profile.teacher_id })
    expect(await observations.findByLearnerId(l.learner_id)).toHaveLength(1)
    expect(await observations.delete(o.observation_id)).toBeTruthy()
    expect(await observations.findById(o.observation_id)).toBeNull()
  })

  it.each([0, 11])('rejects rating %i at the database (23514)', async (rating) => {
    const l = await createLearner()
    await expect(add(l, { rating })).rejects.toMatchObject({ code: '23514' })
  })

  it('aggregates per category for donor reports', async () => {
    const l = await createLearner()
    await add(l, { rating: 6 })
    await add(l, { rating: 8 })
    await add(l, { category: 'Reading', rating: 5 })
    const rows = await observations.getAggregateByDateRange('2026-03-01', '2026-03-31')
    const social = rows.find((r) => r.category === 'Social')
    expect(social.observation_count).toBe('2')
    expect(Number(social.average_rating)).toBe(7)
  })
})

describe('PickupPermissionRepository', () => {
  it('creates, verifies and deletes a permission', async () => {
    const l = await createLearner()
    const p = await pickups.create({
      learnerId: l.learner_id, guardianId: guardian.profile.guardian_id, isPrimaryContact: true, authorisedDate: '2026-01-10',
    })
    expect(await pickups.verifyGuardian(l.learner_id, guardian.profile.guardian_id)).toBe(true)
    expect(await pickups.findById(p.permission_id)).toBeTruthy()
    await pickups.delete(p.permission_id)
    expect(await pickups.verifyGuardian(l.learner_id, guardian.profile.guardian_id)).toBe(false)
  })

  it('refuses the same guardian twice for one learner (23505)', async () => {
    const l = await createLearner()
    await linkGuardian(l, guardian)
    await expect(linkGuardian(l, guardian)).rejects.toMatchObject({ code: '23505' })
  })

  it('verifyGuardian treats injection text as data', async () => {
    const l = await createLearner()
    await linkGuardian(l, guardian)
    await expect(pickups.verifyGuardian(l.learner_id, '1 OR 1=1')).rejects.toMatchObject({ code: '22P02' })
  })
})

describe('SignOutRepository', () => {
  it('creates and finds sign-out records', async () => {
    const l = await createLearner()
    const r = await signOuts.create({
      learnerId: l.learner_id, teacherId: teacher.profile.teacher_id, guardianId: guardian.profile.guardian_id,
      recordDate: '2026-03-02', timeOut: '17:05:00',
    })
    expect(r).toMatchObject({ learner_id: l.learner_id, time_out: '17:05:00' })
    expect(await signOuts.findById(r.record_id)).toMatchObject({ record_id: r.record_id })
    expect(await signOuts.findByLearnerId(l.learner_id)).toHaveLength(1)
  })
})

describe('SignOutRepository: who recorded it', () => {
  it('records a sign-out by a manager, and a walk-home sign-out with no guardian', async () => {
    const l = await createLearner()
    const m = await createUser('manager')
    const r = await signOuts.create({
      learnerId: l.learner_id, managerId: m.profile.manager_id, guardianId: null, recordDate: '2026-03-02', timeOut: '16:00:00',
    })
    expect(r).toMatchObject({ teacher_id: null, manager_id: m.profile.manager_id, guardian_id: null })
  })

  it.each([
    ['neither a teacher nor a manager', {}],
    ['both a teacher and a manager', { both: true }],
  ])('rejects a sign-out recorded by %s (23514)', async (_label, { both }) => {
    const l = await createLearner()
    const m = await createUser('manager')
    await expect(
      signOuts.create({
        learnerId: l.learner_id, teacherId: both ? teacher.profile.teacher_id : null,
        managerId: both ? m.profile.manager_id : null, guardianId: null, recordDate: '2026-03-02', timeOut: '16:00:00',
      }),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('findByDate lists the collector name, or null for walking home', async () => {
    const a = await createLearner()
    const b = await createLearner()
    await signOuts.create({ learnerId: a.learner_id, teacherId: teacher.profile.teacher_id, guardianId: guardian.profile.guardian_id, recordDate: '2026-03-02', timeOut: '16:00:00' })
    await signOuts.create({ learnerId: b.learner_id, teacherId: teacher.profile.teacher_id, guardianId: null, recordDate: '2026-03-02', timeOut: '16:30:00' })
    const rows = await signOuts.findByDate('2026-03-02')
    expect(rows.map((r) => r.guardian_name)).toEqual([guardian.user.full_name, null])
    expect(rows.map((r) => r.recorded_by_name)).toEqual([teacher.user.full_name, teacher.user.full_name])
    expect(await signOuts.findByDate('2026-03-03')).toEqual([])
  })

  it('findByDate names the manager when a manager recorded the sign-out', async () => {
    const m = await createUser('manager', { fullName: 'Sarah Botha' })
    const l = await createLearner()
    await signOuts.create({ learnerId: l.learner_id, managerId: m.profile.manager_id, guardianId: null, recordDate: '2026-03-04', timeOut: '16:00:00' })
    expect((await signOuts.findByDate('2026-03-04'))[0].recorded_by_name).toBe('Sarah Botha')
  })
})

describe('AttendanceRepository.findPresentByDate and PickupPermissionRepository.findActiveByLearnerIds', () => {
  it('lists only active learners marked present that day', async () => {
    const here = await createLearner({ firstName: 'Here' })
    const absent = await createLearner({ firstName: 'Absent' })
    const gone = await createLearner({ firstName: 'Inactive' })
    await markAttendance(here, teacher, { recordDate: '2026-03-02' })
    await markAttendance(absent, teacher, { recordDate: '2026-03-02', status: 'absent' })
    await markAttendance(gone, teacher, { recordDate: '2026-03-02' })
    await learners.update(gone.learner_id, { is_active: false })
    const rows = await attendance.findPresentByDate('2026-03-02')
    expect(rows.map((r) => r.first_name)).toEqual(['Here'])
    expect(rows[0]).toMatchObject({ class_name: 'Yellow', grade_range: 'Gr 1-2' })
  })

  it('returns active pickups only, with no contact numbers', async () => {
    const l = await createLearner()
    const inactive = await createUser('guardian', { isActive: false })
    await linkGuardian(l, guardian)
    await linkGuardian(l, inactive, { isPrimaryContact: false })
    const rows = await pickups.findActiveByLearnerIds([l.learner_id])
    expect(rows).toEqual([
      { learner_id: l.learner_id, guardian_id: guardian.profile.guardian_id, full_name: guardian.user.full_name, relationship: 'Parent', is_primary_contact: true },
    ])
    expect(await pickups.findActiveByLearnerIds([])).toEqual([])
  })
})

describe('ReportRepository', () => {
  it('creates reports and lists them newest first; rejects an inverted period (23514)', async () => {
    const m = await createUser('manager')
    await reports.create({ managerId: m.profile.manager_id, periodStart: '2026-01-01', periodEnd: '2026-03-31' })
    const latest = await reports.create({ managerId: m.profile.manager_id, periodStart: '2026-04-01', periodEnd: '2026-06-30' })
    expect((await reports.findByManagerId(m.profile.manager_id))[0].report_id).toBe(latest.report_id)
    expect(await reports.findById(latest.report_id)).toBeTruthy()
    await expect(
      reports.create({ managerId: m.profile.manager_id, periodStart: '2026-06-30', periodEnd: '2026-01-01' }),
    ).rejects.toMatchObject({ code: '23514' })
  })
})

describe('ON DELETE RESTRICT on sign_out_records', () => {
  let learner
  beforeEach(async () => {
    learner = await createLearner()
    await signOuts.create({
      learnerId: learner.learner_id, teacherId: teacher.profile.teacher_id, guardianId: guardian.profile.guardian_id,
      recordDate: '2026-03-02', timeOut: '17:05:00',
    })
  })

  it('blocks deleting a teacher referenced by a sign-out (23503)', async () => {
    await expect(pool.query('DELETE FROM teachers WHERE "teacher_id" = $1', [teacher.profile.teacher_id])).rejects.toMatchObject({
      code: '23503',
    })
  })

  it('blocks deleting a guardian referenced by a sign-out (23503)', async () => {
    await expect(
      pool.query('DELETE FROM guardians WHERE "guardian_id" = $1', [guardian.profile.guardian_id]),
    ).rejects.toMatchObject({ code: '23503' })
  })

  it('blocks deleting the user account behind such a teacher, via the cascade (23503)', async () => {
    await expect(pool.query('DELETE FROM users WHERE "user_id" = $1', [teacher.user.user_id])).rejects.toMatchObject({
      code: '23503',
    })
  })

  // The API exposes no way to delete a teacher or guardian (they are
  // deactivated instead), so the "RESTRICT surfaces as a 409" path cannot be
  // reached over HTTP. These pin down that behaviour.
  it('has no DELETE endpoint for teachers or guardians (404 JSON, nothing deleted)', async () => {
    const manager = await createUser('manager')
    const t = await request(app).delete(`/api/teacher/${teacher.profile.teacher_id}`).set('Cookie', manager.cookie)
    const g = await request(app).delete(`/api/guardian/${guardian.profile.guardian_id}`).set('Cookie', manager.cookie)
    expect(t.status).toBe(404)
    expect(g.status).toBe(404)
    expect(t.headers['content-type']).toMatch(/json/)
  })

  it('deactivating a teacher with sign-out history works and keeps the history', async () => {
    const manager = await createUser('manager')
    const res = await request(app)
      .patch(`/api/teacher/${teacher.profile.teacher_id}/deactivate`)
      .set('Cookie', manager.cookie)
    expect(res.status).toBe(200)
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM sign_out_records')
    expect(rows[0].n).toBe(1)
  })

  it('deactivating a guardian with sign-out history works and keeps the history', async () => {
    const manager = await createUser('manager')
    const res = await request(app)
      .patch(`/api/guardian/${guardian.profile.guardian_id}/deactivate`)
      .set('Cookie', manager.cookie)
    expect(res.status).toBe(200)
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM sign_out_records')
    expect(rows[0].n).toBe(1)
  })
})
