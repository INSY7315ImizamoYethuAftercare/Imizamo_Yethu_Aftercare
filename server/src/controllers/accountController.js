// accountController.js: the master admin's manager and admin accounts.

import { AccountService } from '../services/AccountService.js'
import UserRepository from '../repositories/UserRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/transaction.js'
import * as validate from '../utils/validation.js'

const service = new AccountService({
  userRepository: new UserRepository(pool),
  adminRepository: new AdminRepository(pool),
  // users + managers/admins are written as one unit.
  runInTransaction: (work) =>
    withTransaction((client) =>
      work({
        userRepository: new UserRepository(client),
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
