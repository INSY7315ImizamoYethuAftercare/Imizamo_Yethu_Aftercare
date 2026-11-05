// Extra AttendanceRepository / SignOutRepository aggregate coverage for live reports.
// These tests belong in tests/repositories/records.test.js — either merge them into
// that file or keep this sibling file next to it (Jest will pick it up).
import { beforeEach, describe, expect, it } from '@jest/globals'
import AttendanceRepository from '../../src/repositories/AttendanceRepository.js'
import SignOutRepository from '../../src/repositories/SignOutRepository.js'
import { classIdByName, pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser, markAttendance } from '../helpers/factory.js'

const attendance = new AttendanceRepository(pool)
const signOuts = new SignOutRepository(pool)

let teacher
let guardian
let yellowId

beforeEach(async () => {
  await resetDb()
  teacher = await createUser('teacher')
  guardian = await createUser('guardian')
  yellowId = await classIdByName('Yellow')
})

describe('AttendanceRepository aggregates (live reports)', () => {
  it('getDailyPresentCounts groups present marks by day', async () => {
    const a = await createLearner()
    const b = await createLearner()
    await markAttendance(a, teacher, { recordDate: '2026-03-02' })
    await markAttendance(b, teacher, { recordDate: '2026-03-02' })
    await markAttendance(a, teacher, { recordDate: '2026-03-03', status: 'absent' })
    await markAttendance(b, teacher, { recordDate: '2026-03-03' })

    const rows = await attendance.getDailyPresentCounts('2026-03-01', '2026-03-07')
    const byDate = Object.fromEntries(
      rows.map((r) => [String(r.record_date).slice(0, 10), Number(r.present_count)]),
    )
    expect(byDate['2026-03-02']).toBe(2)
    expect(byDate['2026-03-03']).toBe(1)
    const absent = Object.fromEntries(rows.map((r) => [String(r.record_date).slice(0, 10), Number(r.absent_count)]))
    expect(absent['2026-03-02']).toBe(0)
    expect(absent['2026-03-03']).toBe(1)
  })

  it('getAttendanceByClass returns rate inputs per class', async () => {
    const yellow = await createLearner({ className: 'Yellow' })
    const green = await createLearner({ className: 'Green' })
    await markAttendance(yellow, teacher, { recordDate: '2026-03-02' })
    await markAttendance(yellow, teacher, { recordDate: '2026-03-03', status: 'absent' })
    await markAttendance(green, teacher, { recordDate: '2026-03-02' })

    const rows = await attendance.getAttendanceByClass('2026-03-01', '2026-03-31')
    const y = rows.find((r) => r.class_name === 'Yellow')
    const g = rows.find((r) => r.class_name === 'Green')
    expect(Number(y.present_count)).toBe(1)
    expect(Number(y.total_count)).toBe(2)
    expect(Number(g.present_count)).toBe(1)
    expect(Number(g.total_count)).toBe(1)
  })

  it('getAttendanceByClass counts each active learner who came once, however many days', async () => {
    const regular = await createLearner({ className: 'Yellow' })
    const neverPresent = await createLearner({ className: 'Yellow' })
    const left = await createLearner({ className: 'Yellow' })
    await markAttendance(regular, teacher, { recordDate: '2026-03-02' })
    await markAttendance(regular, teacher, { recordDate: '2026-03-03' })
    await markAttendance(neverPresent, teacher, { recordDate: '2026-03-02', status: 'absent' })
    await markAttendance(left, teacher, { recordDate: '2026-03-02' })
    await pool.query('UPDATE learners SET "is_active" = false WHERE "learner_id" = $1', [left.learner_id])

    const rows = await attendance.getAttendanceByClass('2026-03-01', '2026-03-31')
    expect(Number(rows.find((r) => r.class_name === 'Yellow').attended_learners)).toBe(1)
  })

  it('getAttendanceRate returns null when empty, otherwise a 0–100 integer', async () => {
    expect(await attendance.getAttendanceRate('2026-03-01', '2026-03-31')).toBeNull()
    const l = await createLearner()
    await markAttendance(l, teacher, { recordDate: '2026-03-02' })
    await markAttendance(l, teacher, { recordDate: '2026-03-03', status: 'absent' })
    expect(await attendance.getAttendanceRate('2026-03-01', '2026-03-31')).toBe(50)
  })

  it('getDaysWithAttendance counts distinct record dates', async () => {
    const l = await createLearner()
    await markAttendance(l, teacher, { recordDate: '2026-03-02' })
    await markAttendance(l, teacher, { recordDate: '2026-03-03' })
    await markAttendance(l, teacher, { recordDate: '2026-03-04', status: 'absent' })
    expect(await attendance.getDaysWithAttendance('2026-03-01', '2026-03-31')).toBe(3)
    expect(await attendance.getDaysWithAttendance('2026-04-01', '2026-04-30')).toBe(0)
  })
})

describe('SignOutRepository.countByDateRange (live reports)', () => {
  it('counts sign-outs in the period', async () => {
    const a = await createLearner()
    const b = await createLearner()
    await signOuts.create({
      learnerId: a.learner_id,
      teacherId: teacher.profile.teacher_id,
      guardianId: guardian.profile.guardian_id,
      recordDate: '2026-03-02',
      timeOut: '16:00:00',
    })
    await signOuts.create({
      learnerId: b.learner_id,
      teacherId: teacher.profile.teacher_id,
      guardianId: guardian.profile.guardian_id,
      recordDate: '2026-03-15',
      timeOut: '16:10:00',
    })
    await signOuts.create({
      learnerId: a.learner_id,
      teacherId: teacher.profile.teacher_id,
      guardianId: guardian.profile.guardian_id,
      recordDate: '2026-04-01',
      timeOut: '16:00:00',
    })

    expect(await signOuts.countByDateRange('2026-03-01', '2026-03-31')).toBe(2)
    expect(await signOuts.countByDateRange('2026-04-01', '2026-04-30')).toBe(1)
    expect(await signOuts.countByDateRange('2026-05-01', '2026-05-31')).toBe(0)
  })
})
