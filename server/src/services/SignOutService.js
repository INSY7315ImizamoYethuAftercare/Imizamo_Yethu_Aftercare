/**
 * SignOutService
 *
 * Business logic for the digital sign-out (collection) flow. Any teacher
 * or manager may verify or confirm a sign-out for any learner — this is
 * deliberate, not an oversight, since a substitute, another class's teacher
 * or the manager may be the one covering pickup for a particular child (see
 * US-19). The safety check that matters here is not "does this teacher own
 * this class", but "is this specific guardian actually allowed to collect
 * this specific learner", which is enforced on every call.
 *
 * A sign-out records who did it: exactly one of teacher_id / manager_id.
 * A null guardian means the learner walked home alone, which is only
 * allowed when learners.can_walk_home_alone is true.
 */
const httpError = (message, status) => {
  const err = new Error(message)
  err.status = status
  return err
}

export class SignOutService {

  constructor({
    signOutRepository, pickupPermissionRepository, teacherRepository, managerRepository, learnerRepository, attendanceRepository,
  }) {
    this.signOutRepository = signOutRepository
    this.pickupPermissionRepository = pickupPermissionRepository
    this.teacherRepository = teacherRepository
    this.managerRepository = managerRepository
    this.learnerRepository = learnerRepository
    this.attendanceRepository = attendanceRepository
  }

  /**
   * Confirms the logged-in user has a real Teacher or Manager record (the
   * role from the JWT says which to look up).
   *
   * @param {number} userId - The user_id from the verified JWT.
   * @param {string} [role] - The role from the verified JWT.
   * @returns {Promise<{ teacherId: number|null, managerId: number|null }>}
   */
  async #getRecorder(userId, role) {
    if (role === 'manager') {
      const manager = await this.managerRepository.findByUserId(userId)
      if (manager) return { teacherId: null, managerId: manager.manager_id }
    } else {
      const teacher = await this.teacherRepository.findByUserId(userId)
      if (teacher) return { teacherId: teacher.teacher_id, managerId: null }
    }
    throw httpError('Only teachers and managers can sign learners out', 403)
  }

  /**
   * Everything the Sign-Out page needs for one day: each active learner
   * marked present, who may collect them, and whether they have already
   * gone (and with whom).
   *
   * @param {{ userId: number, role?: string, date: string }} params
   * @returns {Promise<{ date: string, learners: Array<Object> }>}
   */
  async getDay({ userId, role, date }) {
    await this.#getRecorder(userId, role)

    const present = await this.attendanceRepository.findPresentByDate(date)
    const ids = present.map((l) => l.learner_id)
    const [pickups, signOuts] = await Promise.all([
      this.pickupPermissionRepository.findActiveByLearnerIds(ids),
      this.signOutRepository.findByDate(date),
    ])

    const learners = present.map((l) => {
      const out = signOuts.find((s) => s.learner_id === l.learner_id)
      return {
        learnerId: l.learner_id,
        name: `${l.first_name} ${l.last_name}`,
        className: l.class_name,
        gradeRange: l.grade_range,
        canWalkHomeAlone: l.can_walk_home_alone,
        pickups: pickups
          .filter((p) => p.learner_id === l.learner_id)
          .map((p) => ({
            guardianId: p.guardian_id,
            fullName: p.full_name,
            relationship: p.relationship,
            isPrimaryContact: p.is_primary_contact,
          })),
        signedOut: out
          ? { timeOut: String(out.time_out).slice(0, 5), collectedBy: out.guardian_name ?? 'Walked home alone' }
          : null,
      }
    })

    return { date, learners }
  }

  /**
   * Checks whether a guardian is authorised to collect a learner, without
   * writing anything. Used by the UI to show a clear "authorised" or
   * "not authorised" result before the teacher confirms the collection,
   * and returns the learner's walk-home-alone status so a teacher can
   * make a quick, informed safety decision during busy collection times.
   *
   * @param {Object} params
   * @param {number} params.userId - The requesting user's id.
   * @param {string} [params.role] - The requesting user's role.
   * @param {number} params.learnerId
   * @param {number} params.guardianId - The guardian attempting collection.
   * @returns {Promise<Object>} { authorised, learnerId, guardianId, canWalkHomeAlone, message }
   */
  async verifyGuardian({ userId, role, learnerId, guardianId }) {

    await this.#getRecorder(userId, role)

    const learner = await this.learnerRepository.findById(learnerId)

    if (!learner) throw httpError('Learner not found', 404)

    const authorised = await this.pickupPermissionRepository.verifyGuardian(learnerId, guardianId)

    return {
      authorised,
      learnerId,
      guardianId,
      canWalkHomeAlone: learner.can_walk_home_alone,
      message: authorised
        ? 'Guardian is authorised to collect this learner'
        : 'This person is not authorised to collect this learner. Escalate to the manager.',
    }
  }

  /**
   * Records a learner's collection. Re-checks authorisation independently
   * of verifyGuardian() (never trusts a prior client-side check) and
   * blocks the write entirely if the guardian is not on the learner's
   * pickup permission list (or, with no guardian, if the learner may not
   * walk home alone), if the learner was not marked present on that day
   * (a learner who never arrived, or was marked absent, cannot be
   * collected from the centre), or if they have already been signed out
   * that day.
   *
   * @param {Object} params
   * @param {number} params.userId - The requesting user's id.
   * @param {string} [params.role] - The requesting user's role.
   * @param {number} params.learnerId
   * @param {number|null} params.guardianId - The guardian collecting the learner; null = walking home alone.
   * @param {string} params.timeOut - Time of collection.
   * @param {string} params.recordDate - Date (YYYY-MM-DD) of collection.
   * @returns {Promise<Object>} The created sign-out record.
   */
  async confirmSignOut({ userId, role, learnerId, guardianId, timeOut, recordDate }) {

    const { teacherId, managerId } = await this.#getRecorder(userId, role)

    if (guardianId === null) {
      const learner = await this.learnerRepository.findById(learnerId)
      if (!learner) throw httpError('Learner not found', 404)
      if (!learner.can_walk_home_alone) {
        throw httpError(
          'This learner is not allowed to walk home alone. Someone on their pickup list must collect them.',
          403,
        )
      }
    } else {
      const authorised = await this.pickupPermissionRepository.verifyGuardian(learnerId, guardianId)
      if (!authorised) {
        throw httpError('This person is not authorised to collect this learner. Escalate to the manager.', 403)
      }
    }

    const attendance = await this.attendanceRepository.findByLearnerAndDate(learnerId, recordDate)

    if (attendance?.status !== 'present') {
      throw httpError(
        attendance
          ? 'This learner was marked absent today, so they cannot be signed out. Correct the register first.'
          : 'This learner has not been marked present today, so they cannot be signed out. Take attendance first.',
        409,
      )
    }

    const alreadySignedOut = await this.signOutRepository.findByLearnerAndDate(learnerId, recordDate)

    if (alreadySignedOut) {
      throw httpError(`This learner was already signed out today at ${String(alreadySignedOut.time_out).slice(0, 5)}.`, 409)
    }

    return this.signOutRepository.create({ learnerId, teacherId, managerId, guardianId, recordDate, timeOut })
  }
}
