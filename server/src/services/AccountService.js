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

/** The roles whose accounts a master admin can edit (parents are not staff). */
export const EDITABLE_ROLES = ['teacher', 'manager', 'admin']

/**
 * Manager and admin accounts, plus editing any staff account (teachers too).
 * Only a master admin may use this (enforced by
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

  /**
   * The staff account a master admin is about to change. Parents and other
   * master admins are off limits.
   *
   * @throws {Error} 404 if there is no such account, 403 for a parent or another master admin.
   */
  async #findEditableTarget(userId, targetUserId) {
    await this.#assertIsMasterAdmin(userId)

    const target = await this.userRepository.findById(targetUserId)
    if (!target) throw httpError(404, 'Account not found')
    if (!EDITABLE_ROLES.includes(target.role)) {
      throw httpError(403, 'Only teacher, manager and admin accounts can be edited here')
    }
    if (target.role === 'admin' && targetUserId !== userId) {
      const admin = await this.adminRepository.findByUserId(targetUserId)
      if (admin?.access_level === 'master') throw httpError(403, "You can't edit another master admin's account")
    }
    return target
  }

  /**
   * Edits a teacher, manager or admin account: the name and/or the email
   * they sign in with. Passwords are changed by the user in Settings, or
   * reset with resetPassword. The name is also copied to the
   * teachers/managers/admins row (a master admin has both an admins and a
   * managers row), and a teacher's contact email follows their sign-in email.
   *
   * A master admin can edit their own account, but not another master admin's.
   *
   * @param {Object} params
   * @param {number} params.userId - The master admin making the change.
   * @param {number} params.targetUserId - The account being edited.
   * @param {{ fullName?: string, email?: string }} params.changes
   * @throws {Error} 404 if there is no such account, 403 for a parent or
   *   another master admin, 409 if the email is already used.
   */
  async updateAccount({ userId, targetUserId, changes }) {
    const target = await this.#findEditableTarget(userId, targetUserId)

    const { fullName, email } = changes
    if (email !== undefined && email !== target.email) {
      const existing = await this.userRepository.findByEmail(email)
      if (existing && existing.user_id !== targetUserId) {
        throw httpError(409, 'An account with this email already exists')
      }
    }

    const fields = {}
    if (fullName !== undefined) fields.full_name = fullName
    if (email !== undefined) fields.email = email

    try {
      return await this.runInTransaction(async ({ userRepository, teacherRepository, managerRepository, adminRepository }) => {
        const user = await userRepository.updateById(targetUserId, fields)

        const teacher = await teacherRepository.findByUserId(targetUserId)
        if (teacher) {
          const teacherFields = {}
          if (fullName !== undefined) teacherFields.full_name = fullName
          if (email !== undefined) teacherFields.contact_email = email
          await teacherRepository.update(teacher.teacher_id, teacherFields)
        }
        if (fullName !== undefined) {
          const manager = await managerRepository.findByUserId(targetUserId)
          if (manager) await managerRepository.updateFullName(manager.manager_id, fullName)
          const admin = await adminRepository.findByUserId(targetUserId)
          if (admin) await adminRepository.update(admin.admin_id, { full_name: fullName })
        }

        return {
          userId: user.user_id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          isActive: user.is_active !== false,
        }
      })
    } catch (err) {
      // Another account took the same email at the same moment.
      if (err.code === '23505') throw httpError(409, 'An account with this email already exists')
      throw err
    }
  }

  /**
   * Sets a temporary password for a staff member who has forgotten theirs.
   * It signs them out everywhere, and they must choose their own new password
   * the next time they sign in, so the master admin never knows the password
   * they end up using. Not for the master admin's own account: they change it
   * in Settings, which asks for the current password.
   *
   * @throws {Error} 400 for your own account, 404/403 as for updateAccount.
   */
  async resetPassword({ userId, targetUserId, password }) {
    if (targetUserId === userId) {
      throw httpError(400, 'Change your own password in Settings')
    }
    await this.#findEditableTarget(userId, targetUserId)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    await this.userRepository.setPassword(targetUserId, passwordHash, { changedAt: new Date(), mustChangePassword: true })
  }
}
