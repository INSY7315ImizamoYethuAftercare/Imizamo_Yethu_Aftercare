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

/** One row of the manager's queue, as the API sends it. */
const toEscalation = (row) => ({
  escalationId: row.escalation_id,
  learnerId: row.learner_id,
  learnerName: `${row.first_name} ${row.last_name}`,
  className: row.class_name ?? null,
  collectorName: row.collector_name, // null = wants to walk home alone
  raisedBy: row.raised_by_name,
  raisedAt: row.raised_time,
  status: row.status,
  resolvedBy: row.resolved_by_name,
  resolvedAt: row.resolved_time,
})

export class SignOutService {

  constructor({
    signOutRepository, pickupPermissionRepository, teacherRepository, managerRepository, learnerRepository, attendanceRepository,
    escalationRepository, runInTransaction,
  }) {
    this.signOutRepository = signOutRepository
    this.pickupPermissionRepository = pickupPermissionRepository
    this.teacherRepository = teacherRepository
    this.managerRepository = managerRepository
    this.learnerRepository = learnerRepository
    this.attendanceRepository = attendanceRepository
    this.escalationRepository = escalationRepository
    this.runInTransaction = runInTransaction
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
   * marked present, who may collect them, whether they have already gone
   * (and with whom), and any request waiting for or turned down by a manager.
   *
   * @param {{ userId: number, role?: string, date: string }} params
   * @returns {Promise<{ date: string, learners: Array<Object> }>}
   */
  async getDay({ userId, role, date }) {
    await this.#getRecorder(userId, role)

    const present = await this.attendanceRepository.findPresentByDate(date)
    const ids = present.map((l) => l.learner_id)
    const [pickups, signOuts, escalations] = await Promise.all([
      this.pickupPermissionRepository.findActiveByLearnerIds(ids),
      this.signOutRepository.findByDate(date),
      this.escalationRepository.findByDate(date),
    ])

    const learners = present.map((l) => {
      const out = signOuts.find((s) => s.learner_id === l.learner_id)
      // The newest request is the one that counts (the queue is oldest first).
      const request = escalations.filter((e) => e.learner_id === l.learner_id).at(-1)
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
          ? {
              timeOut: String(out.time_out).slice(0, 5),
              collectedBy: out.guardian_name ?? 'Walked home alone',
              recordedBy: out.recorded_by_name ?? null, // the teacher or manager who signed them out
            }
          : null,
        // What the manager has decided, so staff don't have to guess. Once a
        // learner has gone, the sign-out above says all there is to say.
        escalation: request && !out
          ? {
              status: request.status,
              collectorName: request.collector_name, // null = wants to walk home alone
              resolvedBy: request.resolved_by_name,
              resolvedAt: request.resolved_time,
            }
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

    await this.#assertCanLeave(learnerId, recordDate)

    return this.signOutRepository.create({ learnerId, teacherId, managerId, guardianId, recordDate, timeOut })
  }

  /** A learner can only leave if they came in today and haven't already gone. */
  async #assertCanLeave(learnerId, date, signOutRepository = this.signOutRepository) {
    const attendance = await this.attendanceRepository.findByLearnerAndDate(learnerId, date)

    if (attendance?.status !== 'present') {
      throw httpError(
        attendance
          ? 'This learner was marked absent today, so they cannot be signed out. Correct the register first.'
          : 'This learner has not been marked present today, so they cannot be signed out. Take attendance first.',
        409,
      )
    }

    const alreadySignedOut = await signOutRepository.findByLearnerAndDate(learnerId, date)

    if (alreadySignedOut) {
      throw httpError(`This learner was already signed out today at ${String(alreadySignedOut.time_out).slice(0, 5)}.`, 409)
    }
  }

  /**
   * Sends a collection staff couldn't verify to the manager's queue. Nothing
   * is signed out until a manager approves it.
   *
   * @param {Object} params
   * @param {number} params.userId
   * @param {string} [params.role]
   * @param {number} params.learnerId
   * @param {string|null} params.collectorName - The typed name; null = wants to walk home alone.
   * @param {string} params.date - Today, YYYY-MM-DD.
   * @returns {Promise<Object>} The new queue entry.
   */
  async raiseEscalation({ userId, role, learnerId, collectorName, date }) {
    const { teacherId, managerId } = await this.#getRecorder(userId, role)

    const learner = await this.learnerRepository.findById(learnerId)
    if (!learner) throw httpError('Learner not found', 404)
    if (collectorName === null && learner.can_walk_home_alone) {
      throw httpError('This learner is allowed to walk home alone, so no approval is needed.', 409)
    }

    await this.#assertCanLeave(learnerId, date)

    try {
      const row = await this.escalationRepository.create({ learnerId, recordDate: date, collectorName, teacherId, managerId })
      return toEscalation(row)
    } catch (err) {
      if (err.code === '23505') throw httpError('This learner is already waiting in the manager queue.', 409)
      throw err
    }
  }

  /**
   * Today's queue for the manager: what still needs a decision, and what has
   * been decided.
   *
   * @param {{ date: string }} params - date is YYYY-MM-DD.
   * @returns {Promise<{ date: string, open: Array<Object>, resolved: Array<Object> }>}
   */
  async getEscalations({ date }) {
    const rows = (await this.escalationRepository.findByDate(date)).map(toEscalation)
    return {
      date,
      open: rows.filter((r) => r.status === 'open'),
      resolved: rows.filter((r) => r.status !== 'open'),
    }
  }

  /**
   * A manager's decision on a queue entry. Approving signs the learner out in
   * the same transaction, recording the manager as the person who did it and
   * the approved collector's name. Dismissing leaves the learner at the centre.
   *
   * @param {Object} params
   * @param {number} params.userId
   * @param {string} [params.role]
   * @param {number} params.escalationId
   * @param {'approve'|'dismiss'} params.action
   * @param {string} params.today - YYYY-MM-DD.
   * @param {string} params.timeOut - The sign-out time, if approved.
   * @returns {Promise<Object>} { escalationId, status, signOut: { timeOut }|null }
   */
  async resolveEscalation({ userId, role, escalationId, action, today, timeOut }) {
    const { managerId } = await this.#getRecorder(userId, role)
    if (!managerId) throw httpError('Only a manager can decide on the sign-out queue', 403)

    return this.runInTransaction(async ({ escalationRepository, signOutRepository }) => {
      const status = action === 'approve' ? 'approved' : 'dismissed'
      const closed = await escalationRepository.resolve({ escalationId, status, managerId })
      if (!closed) {
        const existing = await escalationRepository.findById(escalationId)
        if (!existing) throw httpError('This request is no longer in the queue', 404)
        throw httpError(`This request has already been ${existing.status}.`, 409)
      }
      if (status === 'dismissed') return { escalationId, status, signOut: null }

      if (closed.record_date !== today) {
        throw httpError('This request is from an earlier day, so it can only be dismissed.', 409)
      }
      await this.#assertCanLeave(closed.learner_id, today, signOutRepository)

      const record = await signOutRepository.create({
        learnerId: closed.learner_id,
        teacherId: null,
        managerId,
        guardianId: null,
        collectorName: closed.collector_name,
        recordDate: today,
        timeOut,
      })
      return { escalationId, status, signOut: { timeOut: String(record.time_out).slice(0, 5) } }
    })
  }
}
