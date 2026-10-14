// accountController.js: the master admin's manager and admin accounts.

import { AccountService } from '../services/AccountService.js'
import UserRepository from '../repositories/UserRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/transaction.js'
import * as validate from '../utils/validation.js'

const service = new AccountService({
  userRepository: new UserRepository(pool),
  adminRepository: new AdminRepository(pool),
  // users + teachers/managers/admins are written as one unit.
  runInTransaction: (work) =>
    withTransaction((client) =>
      work({
        userRepository: new UserRepository(client),
        teacherRepository: new TeacherRepository(client),
        managerRepository: new ManagerRepository(client),
        adminRepository: new AdminRepository(client),
      }),
    ),
})

export async function listAccounts(req, res, next) {
  try {
    res.json(await service.listAccounts({ userId: req.user.userId }))
  } catch (err) { next(err) }
}

export async function createAccount(req, res, next) {
  try {
    const { type, fullName, email, password } = req.body ?? {}
    if (!type || !fullName || !email || !password) {
      throw validate.badRequest('type, fullName, email and password are required')
    }
    const account = await service.createAccount({
      userId: req.user.userId,
      type: validate.text(type, 'type', { max: 20 }),
      fullName: validate.text(fullName, 'fullName', { max: validate.LIMITS.fullName }),
      email: validate.email(email),
      password: validate.password(password),
    })
    res.status(201).json(account)
  } catch (err) { next(err) }
}

/** PATCH /api/accounts/:userId - edit a teacher, manager or admin's name or email. */
export async function updateAccount(req, res, next) {
  try {
    const { fullName, email, password } = req.body ?? {}
    if (password !== undefined) {
      throw validate.badRequest('Passwords are not changed here: use reset-password')
    }
    const changes = {}
    if (fullName !== undefined) changes.fullName = validate.text(fullName, 'fullName', { max: validate.LIMITS.fullName })
    if (email !== undefined) changes.email = validate.email(email)
    if (Object.keys(changes).length === 0) {
      throw validate.badRequest('At least one of fullName or email is required')
    }
    const account = await service.updateAccount({
      userId: req.user.userId,
      targetUserId: validate.parseId(req.params.userId, 'userId'),
      changes,
    })
    res.json(account)
  } catch (err) { next(err) }
}

/** POST /api/accounts/:userId/reset-password - for a staff member who forgot theirs. */
export async function resetPassword(req, res, next) {
  try {
    const { password } = req.body ?? {}
    if (password === undefined) throw validate.badRequest('password is required')
    await service.resetPassword({
      userId: req.user.userId,
      targetUserId: validate.parseId(req.params.userId, 'userId'),
      password: validate.password(password),
    })
    res.json({ message: 'Password reset' })
  } catch (err) { next(err) }
}
