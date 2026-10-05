import bcrypt from 'bcryptjs'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

const SALT_ROUNDS = 10

/** The kinds of account a master admin can create. */
export const ACCOUNT_TYPES = ['manager', 'standard_admin']

const toAccount = (row) => ({
  userId: row.user_id,
  fullName: row.full_name,
  email: row.email,
  type: row.role === 'manager' ? 'manager' : `${row.access_level ?? 'standard'}_admin`,
  isActive: row.is_active !== false,
})

/**
 * Manager and admin accounts. Only a master admin may use this (enforced by
 * authorize('master_admin') on the routes, and checked again here).
 *
 * runInTransaction runs a callback with { userRepository, managerRepository,
 * adminRepository } bound to one transaction, so a user is never left
 * without its profile row.
 */
export class AccountService {
  constructor({ userRepository, adminRepository, runInTransaction }) {
    this.userRepository = userRepository
    this.adminRepository = adminRepository
    this.runInTransaction = runInTransaction
  }

  async #assertIsMasterAdmin(userId) {
    const admin = await this.adminRepository.findByUserId(userId)
    if (admin?.access_level !== 'master') {
      throw httpError(403, 'Only the master admin can manage manager and admin accounts')
    }
  }

  async listAccounts({ userId }) {
    await this.#assertIsMasterAdmin(userId)
    return (await this.userRepository.findManagersAndAdmins()).map(toAccount)
  }

  /**
   * Creates a manager or a standard admin.
   *
   * @param {Object} params
   * @param {'manager'|'standard_admin'} params.type
   * @throws {Error} 409 if the email is already used.
   */
  async createAccount({ userId, type, fullName, email, password }) {
    await this.#assertIsMasterAdmin(userId)
    if (!ACCOUNT_TYPES.includes(type)) {
      throw httpError(400, 'type must be "manager" or "standard_admin"')
    }

    if (await this.userRepository.findByEmail(email)) {
      throw httpError(409, 'An account with this email already exists')
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const role = type === 'manager' ? 'manager' : 'admin'

    try {
      return await this.runInTransaction(async ({ userRepository, managerRepository, adminRepository }) => {
        const user = await userRepository.createUser({ email, role, passwordHash, fullName, isActive: true })
        if (role === 'manager') {
          await managerRepository.create({ userId: user.user_id, fullName })
        } else {
          await adminRepository.create({ userId: user.user_id, fullName, accessLevel: 'standard' })
        }
        return toAccount({ ...user, access_level: role === 'admin' ? 'standard' : null })
      })
    } catch (err) {
      // The same email registered twice at the same moment.
      if (err.code === '23505') throw httpError(409, 'An account with this email already exists')
      throw err
    }
  }
}
