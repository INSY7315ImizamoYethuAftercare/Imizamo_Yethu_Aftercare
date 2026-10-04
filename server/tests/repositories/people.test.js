// Repository layer against imizamo_test: users and the per-role profile tables.
import { beforeEach, describe, expect, it } from '@jest/globals'
import AdminRepository from '../../src/repositories/AdminRepository.js'
import GuardianRepository from '../../src/repositories/GuardianRepository.js'
import ManagerRepository from '../../src/repositories/ManagerRepository.js'
import TeacherRepository from '../../src/repositories/TeacherRepository.js'
import UserRepository from '../../src/repositories/UserRepository.js'
import { pool, resetDb } from '../helpers/db.js'
import { createUser } from '../helpers/factory.js'

const users = new UserRepository(pool)
const admins = new AdminRepository(pool)
const managers = new ManagerRepository(pool)
const teachers = new TeacherRepository(pool)
const guardians = new GuardianRepository(pool)

const newUser = (overrides = {}) =>
  users.createUser({
    email: 'repo.user@test.iylh.org', role: 'teacher', passwordHash: '$2a$04$hash', fullName: 'Repo User', isActive: true,
    ...overrides,
  })

beforeEach(resetDb)

describe('UserRepository', () => {
  it('createUser returns the new row without password_hash', async () => {
    const u = await newUser()
    expect(u).toEqual({
      user_id: expect.any(Number), email: 'repo.user@test.iylh.org', role: 'teacher', full_name: 'Repo User', is_active: true,
    })
  })

  it('findById never includes password_hash; findByEmail does (login only)', async () => {
    const u = await newUser()
    expect(await users.findById(u.user_id)).not.toHaveProperty('password_hash')
    expect(await users.findByEmail(u.email)).toHaveProperty('password_hash', '$2a$04$hash')
  })

  it('returns null for unknown id/email', async () => {
    expect(await users.findById(999999)).toBeNull()
    expect(await users.findByEmail('nobody@test.iylh.org')).toBeNull()
  })

  it('rejects a duplicate email with unique_violation 23505', async () => {
    await newUser()
    await expect(newUser()).rejects.toMatchObject({ code: '23505' })
  })

  it('rejects a role outside admin/manager/teacher/guardian with check_violation 23514', async () => {
    await expect(newUser({ role: 'superuser' })).rejects.toMatchObject({ code: '23514' })
  })

  it('update only touches whitelisted columns (role and password_hash are ignored)', async () => {
    const u = await newUser()
    await users.update(u.email, { full_name: 'Renamed', role: 'manager', password_hash: 'pwned' })
    const { rows } = await pool.query('SELECT "full_name", "role", "password_hash" FROM users WHERE "user_id" = $1', [u.user_id])
    expect(rows[0]).toEqual({ full_name: 'Renamed', role: 'teacher', password_hash: '$2a$04$hash' })
  })

  it('updatePassword changes the hash and does not return it', async () => {
    const u = await newUser()
    const res = await users.updatePassword(u.email, '$2a$04$newhash')
    expect(res).not.toHaveProperty('password_hash')
    expect((await users.findByEmail(u.email)).password_hash).toBe('$2a$04$newhash')
  })

  it('update and updateRole never return password_hash', async () => {
    const u = await newUser()
    expect(await users.update(u.email, { full_name: 'X' })).not.toHaveProperty('password_hash')
    expect(await users.updateRole(u.user_id, 'manager')).not.toHaveProperty('password_hash')
  })

  it('treats SQL-injection text in an email as plain data', async () => {
    await newUser()
    expect(await users.findByEmail("' OR '1'='1")).toBeNull()
    expect(await users.findByEmail("repo.user@test.iylh.org' --")).toBeNull()
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users')
    expect(rows[0].n).toBe(1)
  })
})

describe('AdminRepository', () => {
  it('creates standard and master admins and finds them by user and id', async () => {
    const u1 = await newUser({ email: 'a1@test.iylh.org', role: 'admin' })
    const u2 = await newUser({ email: 'a2@test.iylh.org', role: 'admin' })
    const std = await admins.create({ userId: u1.user_id, fullName: 'Std', accessLevel: 'standard' })
    const master = await admins.create({ userId: u2.user_id, fullName: 'Master', accessLevel: 'master' })
    expect(std.access_level).toBe('standard')
    expect(master.access_level).toBe('master')
    expect(await admins.findByUserId(u2.user_id)).toMatchObject({ admin_id: master.admin_id })
    expect(await admins.findById(std.admin_id)).toMatchObject({ user_id: u1.user_id })
  })

  it('rejects an unknown access level (23514)', async () => {
    const u = await newUser({ role: 'admin' })
    await expect(admins.create({ userId: u.user_id, fullName: 'X', accessLevel: 'root' })).rejects.toMatchObject({ code: '23514' })
  })

  it('allows only one admin profile per user (23505)', async () => {
    const u = await newUser({ role: 'admin' })
    await admins.create({ userId: u.user_id, fullName: 'X', accessLevel: 'standard' })
    await expect(admins.create({ userId: u.user_id, fullName: 'Y', accessLevel: 'master' })).rejects.toMatchObject({ code: '23505' })
  })

  it('update ignores non-whitelisted columns', async () => {
    const u = await newUser({ role: 'admin' })
    const a = await admins.create({ userId: u.user_id, fullName: 'X', accessLevel: 'standard' })
    const res = await admins.update(a.admin_id, { access_level: 'master', user_id: 999 })
    expect(res).toMatchObject({ access_level: 'master', user_id: u.user_id })
  })
})

describe('ManagerRepository', () => {
  it('creates, finds and renames a manager', async () => {
    const u = await newUser({ role: 'manager' })
    const m = await managers.create({ userId: u.user_id, fullName: 'Sarah' })
    expect(await managers.findByUserId(u.user_id)).toMatchObject({ manager_id: m.manager_id })
    expect(await managers.findById(m.manager_id)).toMatchObject({ user_id: u.user_id })
    await managers.updateFullName(m.manager_id, 'Sarah B')
    expect((await managers.findById(m.manager_id)).full_name).toBe('Sarah B')
  })

  it('returns null for a non-manager user', async () => {
    const t = await createUser('teacher')
    expect(await managers.findByUserId(t.user.user_id)).toBeNull()
  })
})

describe('TeacherRepository', () => {
  it('creates and finds a teacher', async () => {
    const u = await newUser()
    const t = await teachers.create({ userId: u.user_id, fullName: 'Ms Nkosi', contactEmail: 'nkosi@test.iylh.org' })
    expect(await teachers.findByUserId(u.user_id)).toMatchObject({ teacher_id: t.teacher_id })
    expect(await teachers.findById(t.teacher_id)).toMatchObject({ full_name: 'Ms Nkosi' })
  })

  it('findAll includes the account is_active flag', async () => {
    await createUser('teacher')
    await createUser('teacher', { isActive: false })
    const all = await teachers.findAll()
    expect(all).toHaveLength(2)
    expect(all.map((t) => t.is_active).sort()).toEqual([false, true])
  })

  it('setActive toggles the linked users.is_active and returns null for unknown ids', async () => {
    const t = await createUser('teacher')
    expect(await teachers.setActive(t.profile.teacher_id, false)).toMatchObject({ is_active: false })
    const { rows } = await pool.query('SELECT "is_active" FROM users WHERE "user_id" = $1', [t.user.user_id])
    expect(rows[0].is_active).toBe(false)
    expect(await teachers.setActive(999999, false)).toBeNull()
  })

  it('update ignores user_id and other non-whitelisted columns', async () => {
    const t = await createUser('teacher')
    const res = await teachers.update(t.profile.teacher_id, { full_name: 'New', user_id: 999999 })
    expect(res).toMatchObject({ full_name: 'New', user_id: t.user.user_id })
    expect(await teachers.update(999999, { full_name: 'X' })).toBeNull()
  })
})

describe('GuardianRepository', () => {
  it('create stores the guardian with what they claimed at sign-up', async () => {
    const u = await newUser({ role: 'guardian' })
    const g = await guardians.create({
      userId: u.user_id, fullName: 'Fatima', contactNumber: '082', relationship: 'Mother',
      claimedLearnerName: 'Aisha Petersen', claimedLearnerDob: '2018-03-14',
    })
    expect(g).toMatchObject({ user_id: u.user_id, claimed_learner_name: 'Aisha Petersen' })
  })

  it('finds by user id and guardian id', async () => {
    const g = await createUser('guardian')
    expect(await guardians.findByUserId(g.user.user_id)).toMatchObject({ guardian_id: g.profile.guardian_id })
    expect(await guardians.findById(g.profile.guardian_id)).toMatchObject({ user_id: g.user.user_id })
    expect(await guardians.findById(999999)).toBeNull()
  })

  it('update changes whitelisted fields only', async () => {
    const g = await createUser('guardian')
    const res = await guardians.update(g.profile.guardian_id, { contact_number: '0831112222', user_id: 999999 })
    expect(res).toMatchObject({ contact_number: '0831112222', user_id: g.user.user_id })
  })

  it('setActive toggles the linked account', async () => {
    const g = await createUser('guardian')
    expect(await guardians.setActive(g.profile.guardian_id, false)).toMatchObject({ is_active: false })
    expect(await guardians.setActive(999999, false)).toBeNull()
  })
})
