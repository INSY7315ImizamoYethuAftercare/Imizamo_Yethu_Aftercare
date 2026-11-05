// Each request schema, checked directly. Database-free.
import { describe, expect, it } from '@jest/globals'
import * as account from './schemas/accountSchemas.js'
import * as attendance from './schemas/attendanceSchemas.js'
import * as auth from './schemas/authSchemas.js'
import * as guardian from './schemas/guardianSchemas.js'
import * as learner from './schemas/learnerSchemas.js'
import * as observation from './schemas/observationSchemas.js'
import * as report from './schemas/reportSchemas.js'
import * as schoolClass from './schemas/schoolClassSchemas.js'
import * as signOut from './schemas/signOutSchemas.js'
import * as teacher from './schemas/teacherSchemas.js'

// Parses { params, body, query } the way validate() does and returns the
// parsed parts, or "ERR: <first message>".
const parse = (schemas, { params = {}, body = {}, query = {} } = {}) => {
  const out = {}
  for (const [part, input] of Object.entries({ params, body, query })) {
    if (!schemas[part]) continue
    const result = schemas[part].safeParse(input)
    if (!result.success) return `ERR: ${result.error.issues[0].message}`
    out[part] = result.data
  }
  return out
}

describe('accounts', () => {
  const NEW = { type: 'manager', fullName: 'Thabo M', email: ' Thabo@Test.org ', password: 'Long-enough-1' }

  it('create normalises the email and keeps the rest', () => {
    expect(parse(account.createAccount, { body: NEW }).body).toEqual({ ...NEW, email: 'thabo@test.org' })
  })

  it.each([
    [{ password: 'short' }, /at least 8/],
    [{ email: 'not-an-email' }, /valid email/],
    [{ fullName: '' }, /required/],
    [{ type: undefined }, /type is required/],
  ])('create refuses %o', (change, message) => {
    expect(parse(account.createAccount, { body: { ...NEW, ...change } })).toMatch(message)
  })

  it('update keeps only what was sent', () => {
    const result = parse(account.updateAccount, { params: { userId: '9' }, body: { fullName: 'New Name' } })
    expect(result).toEqual({ params: { userId: 9 }, body: { fullName: 'New Name' } })
  })

  it.each([
    [{}, /At least one of fullName or email/],
    [{ email: 'nope' }, /valid email/],
    [{ fullName: '' }, /required/],
    [{ password: 'Sneaky-new-pass-1' }, /use reset-password/],
    [{ password: 'Sneaky-new-pass-1', fullName: 'X' }, /use reset-password/],
  ])('update refuses %o', (body, message) => {
    expect(parse(account.updateAccount, { params: { userId: '9' }, body })).toMatch(message)
  })

  it('reset-password needs a good password and an id', () => {
    expect(parse(account.resetPassword, { params: { userId: '9' }, body: {} })).toBe('ERR: password is required')
    expect(parse(account.resetPassword, { params: { userId: '9' }, body: { password: 'short' } })).toMatch(/at least 8/)
    expect(parse(account.resetPassword, { params: { userId: 'x' }, body: { password: 'Long-enough-1' } })).toMatch(/userId/)
  })
})

describe('attendance', () => {
  it('record: ids become numbers, classId and timeIn are optional', () => {
    expect(parse(attendance.recordAttendance, { body: { learnerId: '3', status: 'present' } }).body).toEqual({ learnerId: 3, status: 'present' })
    expect(parse(attendance.recordAttendance, { body: { learnerId: 3, classId: '2', status: 'absent', timeIn: '07:45' } }).body)
      .toEqual({ learnerId: 3, classId: 2, status: 'absent', timeIn: '07:45' })
  })

  it.each([
    [{ status: 'present' }, /learnerId is required/],
    [{ learnerId: 1 }, /status is required/],
    [{ learnerId: 1, status: ['present'] }, /status must be text/],
    [{ learnerId: 'abc', status: 'present' }, /learnerId must be a positive whole number/],
    [{ learnerId: 1, status: 'present', timeIn: '25:00' }, /timeIn must be a time/],
  ])('record refuses %o', (body, message) => {
    expect(parse(attendance.recordAttendance, { body })).toMatch(message)
  })

  it('update needs a record id and a status', () => {
    expect(parse(attendance.updateAttendance, { params: { recordId: '4' }, body: { status: 'absent' } }).params).toEqual({ recordId: 4 })
    expect(parse(attendance.updateAttendance, { params: { recordId: "1' OR '1'='1" }, body: { status: 'absent' } })).toMatch(/recordId/)
    expect(parse(attendance.updateAttendance, { params: { recordId: '4' }, body: {} })).toBe('ERR: status is required')
  })

  it('class attendance: date is optional but must be a real date', () => {
    expect(parse(attendance.getClassAttendance, { params: { classId: '2' }, query: {} }).query).toEqual({})
    expect(parse(attendance.getClassAttendance, { params: { classId: '2' }, query: { date: '2026-03-02' } }).query).toEqual({ date: '2026-03-02' })
    expect(parse(attendance.getClassAttendance, { params: { classId: '2' }, query: { date: "2026-01-01' OR '1'='1" } })).toMatch(/date must be a date/)
    expect(parse(attendance.getClassAttendance, { params: { classId: '2' }, query: { date: ['2026-03-02', '2026-03-03'] } })).toMatch(/date must be a date/)
  })
})

describe('auth', () => {
  const GUARDIAN = {
    email: 'P@Test.org', password: 'Long-enough-1', role: 'guardian', fullName: 'Parent',
    contactNumber: '082 555 0100', relationship: 'Mother', claimedLearnerName: 'A B', claimedLearnerDob: '2018-03-14',
  }

  it('register normalises the email and passes the guardian fields through', () => {
    expect(parse(auth.register, { body: GUARDIAN }).body).toEqual({ ...GUARDIAN, email: 'p@test.org' })
  })

  it('register leaves the guardian fields to AuthService when they are missing', () => {
    const staff = { email: 't@test.org', password: 'Long-enough-1', role: 'teacher', fullName: 'T' }
    expect(parse(auth.register, { body: staff }).body).toEqual(staff)
  })

  it.each(['email', 'password', 'role', 'fullName'])('register refuses a missing %s', (field) => {
    const body = { ...GUARDIAN }
    delete body[field]
    expect(parse(auth.register, { body })).toBe(`ERR: ${field} is required`)
  })

  it.each([
    [{ claimedLearnerDob: '2018-13-01' }, /claimedLearnerDob must be a date/],
    [{ contactNumber: 'x'.repeat(31) }, /contactNumber must be at most 30/],
    [{ relationship: 5 }, /relationship must be text/],
    [{ password: 'short' }, /at least 8/],
  ])('register refuses %o', (change, message) => {
    expect(parse(auth.register, { body: { ...GUARDIAN, ...change } })).toMatch(message)
  })

  it('login checks only the type, so a short old password is fine', () => {
    expect(parse(auth.login, { body: { email: 'Old@Test.org', password: 'abc' } }).body).toEqual({ email: 'Old@Test.org', password: 'abc' })
    expect(parse(auth.login, { body: { email: 'a@b.co', password: 'abc', role: 'teacher' } }).body.role).toBe('teacher')
  })

  it.each([
    [{}, /email is required/],
    [{ email: 'a@b.co' }, /password is required/],
    [{ email: ['a@b.co'], password: 'x' }, /email must be text/],
    [{ email: 'a@b.co', password: { $ne: '' } }, /password must be text/],
    [{ email: 'a@b.co', password: 'x', role: 'x'.repeat(21) }, /role must be at most 20/],
  ])('login refuses %o', (body, message) => {
    expect(parse(auth.login, { body })).toMatch(message)
  })

  it('change-password needs both passwords, and a long enough new one', () => {
    expect(parse(auth.changePassword, { body: { currentPassword: 'old', newPassword: 'Brand-new-pass-1' } }).body)
      .toEqual({ currentPassword: 'old', newPassword: 'Brand-new-pass-1' })
    expect(parse(auth.changePassword, { body: { newPassword: 'Brand-new-pass-1' } })).toBe('ERR: currentPassword is required')
    expect(parse(auth.changePassword, { body: { currentPassword: 'old' } })).toBe('ERR: newPassword is required')
    expect(parse(auth.changePassword, { body: { currentPassword: 'old', newPassword: 'short' } })).toMatch(/newPassword must be at least 8/)
  })
})

describe('guardian', () => {
  const PICKUP = { fullName: 'Zainab H', relationship: 'Aunt', contactNumber: '082 555 0199' }

  it('pickup defaults canWalkHomeAlone to false and reads "true" as true', () => {
    expect(parse(guardian.addChildPickup, { params: { learnerId: '3' }, body: PICKUP }).body).toEqual({ ...PICKUP, canWalkHomeAlone: false })
    expect(parse(guardian.addChildPickup, { params: { learnerId: '3' }, body: { ...PICKUP, canWalkHomeAlone: 'true' } }).body.canWalkHomeAlone).toBe(true)
    expect(parse(guardian.addChildPickup, { params: { learnerId: '3' }, body: { ...PICKUP, canWalkHomeAlone: 'false' } }).body.canWalkHomeAlone).toBe(false)
  })

  it.each([
    [{ fullName: '' }, /fullName/],
    [{ relationship: undefined }, /relationship/],
    [{ contactNumber: undefined }, /contactNumber/],
    [{ fullName: 'x'.repeat(151) }, /fullName must be at most 150/],
  ])('pickup refuses %o', (change, message) => {
    expect(parse(guardian.addChildPickup, { params: { learnerId: '3' }, body: { ...PICKUP, ...change } })).toMatch(message)
  })

  it('child and guardian routes need a numeric id', () => {
    expect(parse(guardian.childParams, { params: { learnerId: '3' } }).params).toEqual({ learnerId: 3 })
    expect(parse(guardian.childParams, { params: { learnerId: 'abc' } })).toMatch(/learnerId/)
    expect(parse(guardian.guardianParams, { params: { guardianId: 'abc' } })).toMatch(/guardianId/)
  })
})

describe('learners', () => {
  const NEW = { classId: '2', firstName: 'Sipho', lastName: 'Dlamini' }

  it('create: optional date of birth, flag defaults to false', () => {
    expect(parse(learner.createLearner, { body: NEW }).body).toEqual({ classId: 2, firstName: 'Sipho', lastName: 'Dlamini', canWalkHomeAlone: false })
    expect(parse(learner.createLearner, { body: { ...NEW, dateOfBirth: '2018-03-14', canWalkHomeAlone: true } }).body)
      .toEqual({ classId: 2, firstName: 'Sipho', lastName: 'Dlamini', dateOfBirth: '2018-03-14', canWalkHomeAlone: true })
    expect(parse(learner.createLearner, { body: { ...NEW, dateOfBirth: '' } }).body.dateOfBirth).toBeUndefined()
  })

  it('create keeps a hostile name exactly as sent (it is data, not code)', () => {
    const firstName = "Robert'); DROP TABLE learners; --"
    expect(parse(learner.createLearner, { body: { ...NEW, firstName } }).body.firstName).toBe(firstName)
  })

  it.each([
    [{ classId: undefined }, /classId is required/],
    [{ classId: 'abc' }, /classId must be a positive whole number/],
    [{ firstName: '' }, /firstName is required/],
    [{ lastName: 'x'.repeat(101) }, /lastName must be at most 100/],
    [{ dateOfBirth: '2026-02-30' }, /dateOfBirth must be a date/],
  ])('create refuses %o', (change, message) => {
    expect(parse(learner.createLearner, { body: { ...NEW, ...change } })).toMatch(message)
  })

  it('update renames the sent keys to column names and drops the rest', () => {
    const result = parse(learner.updateLearner, {
      params: { learnerId: '5' },
      body: { firstName: 'S', canWalkHomeAlone: 'true', isActive: 'false', classId: '3', role: 'admin' },
    })
    expect(result.params).toEqual({ learnerId: 5 })
    expect(result.body).toEqual({ first_name: 'S', can_walk_home_alone: true, is_active: false, class_id: 3 })
  })

  it('update: null or "" clears the date of birth, and an empty edit stays empty', () => {
    expect(parse(learner.updateLearner, { params: { learnerId: '5' }, body: { dateOfBirth: null } }).body).toEqual({ date_of_birth: null })
    expect(parse(learner.updateLearner, { params: { learnerId: '5' }, body: { dateOfBirth: '' } }).body).toEqual({ date_of_birth: null })
    expect(parse(learner.updateLearner, { params: { learnerId: '5' }, body: {} }).body).toEqual({})
  })

  it('update: an isActive "false" stays false, so a learner is not re-activated by mistake', () => {
    expect(parse(learner.updateLearner, { params: { learnerId: '5' }, body: { isActive: 'false' } }).body).toEqual({ is_active: false })
  })

  it('update and the other routes refuse a bad id', () => {
    expect(parse(learner.updateLearner, { params: { learnerId: 'abc' }, body: {} })).toMatch(/learnerId/)
    expect(parse(learner.learnerParams, { params: { learnerId: '0' } })).toMatch(/learnerId/)
  })
})

describe('observations', () => {
  const NEW = { learnerId: 3, category: 'Social', rating: 7 }

  it('add: notes are optional', () => {
    expect(parse(observation.addObservation, { body: NEW }).body).toEqual(NEW)
    expect(parse(observation.addObservation, { body: { ...NEW, notes: 'Kind to others' } }).body.notes).toBe('Kind to others')
    expect(parse(observation.addObservation, { body: { ...NEW, notes: null } }).body.notes).toBeNull()
  })

  it.each([
    [{ rating: '7' }, /rating must be a whole number from 1 to 10/],
    [{ rating: 11 }, /rating must be a whole number from 1 to 10/],
    [{ rating: 0 }, /rating must be a whole number from 1 to 10/],
    [{ rating: undefined }, /rating is required/],
    [{ category: '' }, /category is required/],
    [{ learnerId: undefined }, /learnerId is required/],
    [{ notes: 'x'.repeat(2001) }, /notes must be at most 2000/],
  ])('add refuses %o', (change, message) => {
    expect(parse(observation.addObservation, { body: { ...NEW, ...change } })).toMatch(message)
  })

  it('update keeps only what was sent, and null clears the notes', () => {
    expect(parse(observation.updateObservation, { params: { observationId: '8' }, body: { rating: 9 } }).body).toEqual({ rating: 9 })
    expect(parse(observation.updateObservation, { params: { observationId: '8' }, body: { notes: 'More confident' } }).body).toEqual({ notes: 'More confident' })
    expect(parse(observation.updateObservation, { params: { observationId: '8' }, body: { notes: null } }).body).toEqual({ notes: null })
    expect(parse(observation.updateObservation, { params: { observationId: '8' }, body: { rating: 0 } })).toMatch(/rating/)
  })

  it('learner and observation routes need a numeric id', () => {
    expect(parse(observation.learnerParams, { params: { learnerId: "1' OR '1'='1" } })).toMatch(/learnerId/)
    expect(parse(observation.observationParams, { params: { observationId: 'abc' } })).toMatch(/observationId/)
  })
})

describe('reports', () => {
  it('donor needs both dates, real ones, in order', () => {
    expect(parse(report.donorReport, { query: { periodStart: '2026-01-01', periodEnd: '2026-12-31' } }).query)
      .toEqual({ periodStart: '2026-01-01', periodEnd: '2026-12-31' })
    expect(parse(report.donorReport, { query: { periodEnd: '2026-12-31' } })).toBe('ERR: periodStart is required')
    expect(parse(report.donorReport, { query: { periodStart: '2026-01-01' } })).toBe('ERR: periodEnd is required')
    expect(parse(report.donorReport, { query: { periodStart: '2026-13-45', periodEnd: '2026-12-31' } })).toMatch(/periodStart must be a date/)
    expect(parse(report.donorReport, { query: { periodStart: "2026-01-01' OR '1'='1", periodEnd: '2026-12-31' } })).toMatch(/periodStart must be a date/)
    expect(parse(report.donorReport, { query: { periodStart: '2026-02-01', periodEnd: '2026-01-01' } })).toBe('ERR: periodStart must not be after periodEnd')
  })

  it('overview: both dates are optional but must be real when given', () => {
    expect(parse(report.overviewReport, { query: {} }).query).toEqual({})
    expect(parse(report.overviewReport, { query: { periodStart: '', periodEnd: '' } }).query).toEqual({})
    expect(parse(report.overviewReport, { query: { periodStart: '2026-01-01' } }).query).toEqual({ periodStart: '2026-01-01' })
    expect(parse(report.overviewReport, { query: { periodEnd: 'yesterday' } })).toMatch(/periodEnd must be a date/)
  })
})

describe('classes', () => {
  const NEW = { className: 'Brown', gradeRange: 'Gr 1-2' }

  it('create: teacherId and colour are optional', () => {
    expect(parse(schoolClass.createClass, { body: NEW }).body).toEqual(NEW)
    expect(parse(schoolClass.createClass, { body: { ...NEW, teacherId: '4', colour: '#ffd166' } }).body)
      .toEqual({ ...NEW, teacherId: 4, colour: '#FFD166' })
    expect(parse(schoolClass.createClass, { body: { ...NEW, teacherId: null, colour: null } }).body).toEqual({ ...NEW, colour: null })
  })

  it.each([
    [{ className: undefined }, /className is required/],
    [{ gradeRange: '' }, /gradeRange is required/],
    [{ colour: 'purple' }, /hex colour/],
    [{ colour: 123 }, /hex colour/],
    [{ teacherId: 'abc' }, /teacherId must be a positive whole number/],
  ])('create refuses %o', (change, message) => {
    expect(parse(schoolClass.createClass, { body: { ...NEW, ...change } })).toMatch(message)
  })

  it('update renames keys to column names; null unassigns the teacher and clears the colour', () => {
    const result = parse(schoolClass.updateClass, { params: { classId: '2' }, body: { className: 'Teal', teacherId: null, colour: null } })
    expect(result.body).toEqual({ class_name: 'Teal', teacher_id: null, colour: null })
    expect(parse(schoolClass.updateClass, { params: { classId: '2' }, body: { gradeRange: 'Gr 3', teacherId: '6', colour: '#abcdef' } }).body)
      .toEqual({ grade_range: 'Gr 3', teacher_id: 6, colour: '#ABCDEF' })
    expect(parse(schoolClass.updateClass, { params: { classId: '2' }, body: {} }).body).toEqual({})
    expect(parse(schoolClass.updateClass, { params: { classId: '2' }, body: { teacherId: 'abc' } })).toMatch(/teacherId/)
  })

  it('the list reads includeInactive=true only', () => {
    expect(parse(schoolClass.listClasses, { query: {} }).query).toEqual({})
    expect(parse(schoolClass.listClasses, { query: { includeInactive: 'true' } }).query).toEqual({ includeInactive: true })
    expect(parse(schoolClass.listClasses, { query: { includeInactive: 'false' } }).query).toEqual({ includeInactive: false })
    expect(parse(schoolClass.listClasses, { query: { includeInactive: 'yes' } }).query).toEqual({ includeInactive: false })
  })

  it('class routes need a numeric id', () => {
    expect(parse(schoolClass.classParams, { params: { classId: "1' OR '1'='1" } })).toMatch(/classId/)
  })
})

describe('sign-out', () => {
  it('verify needs both ids', () => {
    expect(parse(signOut.verifyGuardian, { body: { learnerId: '1', guardianId: '2' } }).body).toEqual({ learnerId: 1, guardianId: 2 })
    expect(parse(signOut.verifyGuardian, { body: { learnerId: 1 } })).toBe('ERR: guardianId is required')
    expect(parse(signOut.verifyGuardian, { body: { guardianId: 1 } })).toBe('ERR: learnerId is required')
  })

  it('confirm needs guardianId to be sent: an id, or null for walking home alone', () => {
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1, guardianId: 2 } }).body).toEqual({ learnerId: 1, guardianId: 2 })
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1, guardianId: null } }).body).toEqual({ learnerId: 1, guardianId: null })
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1 } })).toBe('ERR: guardianId is required')
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1, guardianId: '' } })).toBe('ERR: guardianId is required')
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1, guardianId: 'abc' } })).toMatch(/guardianId must be a positive/)
    expect(parse(signOut.confirmSignOut, { body: { guardianId: null } })).toBe('ERR: learnerId is required')
  })

  it('confirm: timeOut is optional but must be a time', () => {
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1, guardianId: 2, timeOut: '15:30' } }).body.timeOut).toBe('15:30')
    expect(parse(signOut.confirmSignOut, { body: { learnerId: 1, guardianId: 2, timeOut: 'later' } })).toMatch(/timeOut must be a time/)
  })
})

describe('teachers', () => {
  const NEW = { email: 'Teacher@Test.org', password: 'Long-enough-1', fullName: 'Ms Nkosi' }

  it('create: contactEmail defaults to the (normalised) email', () => {
    expect(parse(teacher.createTeacher, { body: NEW }).body)
      .toEqual({ ...NEW, email: 'teacher@test.org', contactEmail: 'teacher@test.org' })
    expect(parse(teacher.createTeacher, { body: { ...NEW, contactEmail: 'Other@Test.org' } }).body.contactEmail).toBe('other@test.org')
  })

  it.each([
    [{ email: 'not-an-email' }, /email must be a valid/],
    [{ password: 'short' }, /at least 8/],
    [{ fullName: undefined }, /fullName is required/],
    [{ contactEmail: 'nope' }, /contactEmail must be a valid/],
  ])('create refuses %o', (change, message) => {
    expect(parse(teacher.createTeacher, { body: { ...NEW, ...change } })).toMatch(message)
  })

  it('update renames keys to column names and refuses an empty edit', () => {
    expect(parse(teacher.updateTeacher, { params: { teacherId: '3' }, body: { fullName: 'Ms N', contactEmail: 'N@Test.org' } }).body)
      .toEqual({ full_name: 'Ms N', contact_email: 'n@test.org' })
    expect(parse(teacher.updateTeacher, { params: { teacherId: '3' }, body: { fullName: 'Ms N' } }).body).toEqual({ full_name: 'Ms N' })
    expect(parse(teacher.updateTeacher, { params: { teacherId: '3' }, body: {} })).toBe('ERR: At least one of fullName or contactEmail is required')
    expect(parse(teacher.updateTeacher, { params: { teacherId: '3' }, body: { contactEmail: 'nope' } })).toMatch(/contactEmail must be a valid/)
  })

  it('activate and deactivate need a numeric id', () => {
    expect(parse(teacher.teacherParams, { params: { teacherId: 'abc' } })).toMatch(/teacherId/)
  })
})
