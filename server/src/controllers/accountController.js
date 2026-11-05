// accountController.js: the master admin's manager and admin accounts.

import { AccountService } from '../services/AccountService.js'
import UserRepository from '../repositories/UserRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/transaction.js'

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
    const { type, fullName, email, password } = req.validated.body
    const account = await service.createAccount({ userId: req.user.userId, type, fullName, email, password })
    res.status(201).json(account)
  } catch (err) { next(err) }
}

/** PATCH /api/accounts/:userId - edit a teacher, manager or admin's name or email. */
export async function updateAccount(req, res, next) {
  try {
    // The schema has already refused a password and an empty edit; only fullName and/or email remain.
    const account = await service.updateAccount({
      userId: req.user.userId,
      targetUserId: req.validated.params.userId,
      changes: req.validated.body,
    })
    res.json(account)
  } catch (err) { next(err) }
}

/** POST /api/accounts/:userId/reset-password - for a staff member who forgot theirs. */
export async function resetPassword(req, res, next) {
  try {
    await service.resetPassword({
      userId: req.user.userId,
      targetUserId: req.validated.params.userId,
      password: req.validated.body.password,
    })
    res.json({ message: 'Password reset' })
  } catch (err) { next(err) }
}
