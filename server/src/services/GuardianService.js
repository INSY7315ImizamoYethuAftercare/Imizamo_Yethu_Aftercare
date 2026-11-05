/**
 * GuardianService
 *
 * Business logic for the Parent/Guardian portal. 
 * A guardian must only ever be able to see information about their own
 * child or children, never another family's. Every method that returns
 * learner-specific data routes through #assertOwnsLearner, so this rule
 * cannot be accidentally skipped by a future method that forgets to check.
 */
const httpError = (message, status) => {
  const err = new Error(message)
  err.status = status
  return err
}

/** YYYY-MM-DD minus n days, as YYYY-MM-DD (calendar arithmetic, no time zones). */
const daysBefore = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

const hhmm = (time) => (time ? String(time).slice(0, 5) : null)

export const ATTENDANCE_PERIOD_DAYS = 30
const WEEK_DAYS = 7

export class GuardianService {

  /**
   * runInTransaction is optional: when given (as in the controller) it runs a
   * callback with { guardianRepository, pickupPermissionRepository,
   * learnerRepository } bound to one transaction. Without it the plain
   * repositories are used (unit tests with mocks).
   */
  constructor({
    guardianRepository, learnerRepository, attendanceRepository, observationRepository, managerRepository,
    signOutRepository, pickupPermissionRepository, schoolClassRepository, teacherRepository, runInTransaction,
  }) {
    this.guardianRepository = guardianRepository
    this.learnerRepository = learnerRepository
    this.attendanceRepository = attendanceRepository
    this.observationRepository = observationRepository
    this.managerRepository = managerRepository
    this.signOutRepository = signOutRepository
    this.pickupPermissionRepository = pickupPermissionRepository
    this.schoolClassRepository = schoolClassRepository
    this.teacherRepository = teacherRepository
    this.runInTransaction = runInTransaction ?? ((work) => work(this))
  }

async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId)
    if (!manager) {
      const err = new Error('Only managers can manage guardian accounts')
      err.status = 403
      throw err
    }
  }


  /**
   * Confirms the logged-in user has a real Guardian record.
   *
   * @param {number} userId - The user_id from the verified JWT.
   * @returns {Promise<number>} The guardian's guardian_id.
   */
  async #getGuardianId(userId) {

    const guardian = await this.guardianRepository.findByUserId(userId)

    if (!guardian) {
      const err = new Error('Only guardians can perform this action')
      err.status = 403
      throw err
    }

    return guardian.guardian_id
  }

  /**
   * Central guard for US25. Confirms the requested learner is actually
   * one of this guardian's own children (via their pickup permissions)
   * before any child-specific data is returned. Every guardian-facing
   * method below calls this first.
   *
   * @param {number} userId
   * @param {number} learnerId - The learner being requested.
   * @returns {Promise<number>} The guardian's guardian_id, for reuse by the caller.
   */
  async #assertOwnsLearner(userId, learnerId) {

    const guardianId = await this.#getGuardianId(userId)

    const children = await this.learnerRepository.findByGuardianId(guardianId)

    const owns = children.some((child) => child.learner_id === Number(learnerId))

    if (!owns) {
      const err = new Error('You can only view information for your own children')
      err.status = 403
      throw err
    }

    return guardianId
  }

  /**
   * The logged-in guardian's own details and children, for their Settings page.
   *
   * @param {number} userId
   * @returns {Promise<{ fullName: string, contactNumber: string, relationship: string,
   *   children: Array<{ learnerId: number, name: string }> }>}
   */
  async getMyProfile(userId) {
    const guardian = await this.guardianRepository.findByUserId(userId)
    if (!guardian) throw httpError('Only guardians can perform this action', 403)

    const children = await this.learnerRepository.findByGuardianId(guardian.guardian_id)

    return {
      fullName: guardian.full_name,
      contactNumber: guardian.contact_number,
      relationship: guardian.relationship,
      children: children.map((c) => ({ learnerId: c.learner_id, name: `${c.first_name} ${c.last_name}` })),
    }
  }

  /**
   * Lists all learners linked to the logged-in guardian.
   *
   * @param {number} userId
   * @returns {Promise<Array<Object>>} This guardian's own children.
   */
  async getMyChildren(userId) {

    const guardianId = await this.#getGuardianId(userId)

    return this.learnerRepository.findByGuardianId(guardianId)
  }

  /**
   * Retrieves one child's profile, after confirming the requester is
   * actually that child's guardian.
   */
  async getChildProfile({ userId, learnerId }) {

    await this.#assertOwnsLearner(userId, learnerId)

    return this.learnerRepository.findById(learnerId)
  }

  /**
   * Retrieves one child's development observations, after confirming the
   * requester is actually that child's guardian.
   */
  async getChildObservations({ userId, learnerId }) {

    await this.#assertOwnsLearner(userId, learnerId)

    return this.observationRepository.findByLearnerId(learnerId)
  }

  /**
   * Everything the parent home page shows for one child: today's status,
   * attendance over the last 30 days, the last 7 days, who may collect the
   * child, the class teacher's contact details and the teachers'
   * observations. Only for the requester's own child.
   *
   * @param {{ userId: number, learnerId: number, today: string }} params - today is the SA date, YYYY-MM-DD
   */
  async getChildOverview({ userId, learnerId, today }) {
    const myGuardianId = await this.#assertOwnsLearner(userId, learnerId)

    const learner = await this.learnerRepository.findById(learnerId)
    if (!learner) throw httpError('Learner not found', 404)

    const periodStart = daysBefore(today, ATTENDANCE_PERIOD_DAYS - 1)
    const weekStart = daysBefore(today, WEEK_DAYS - 1)

    const [attendance, signOuts, pickups, schoolClass, observations] = await Promise.all([
      this.attendanceRepository.findByLearnerSince(learnerId, periodStart),
      this.signOutRepository.findByLearnerSince(learnerId, weekStart),
      this.pickupPermissionRepository.findActiveByLearnerIds([learnerId]),
      this.schoolClassRepository.findById(learner.class_id),
      this.observationRepository.findByLearnerIdWithTeacher(learnerId),
    ])
    const teacher = schoolClass?.teacher_id ? await this.teacherRepository.findById(schoolClass.teacher_id) : null

    const signOutOn = (date) => {
      const s = signOuts.find((o) => o.record_date === date)
      return s ? { timeOut: hhmm(s.time_out), collectedBy: s.guardian_name ?? 'Walked home alone' } : null
    }
    const presentDays = attendance.filter((a) => a.status === 'present').length
    const todayRecord = attendance.find((a) => a.record_date === today)

    return {
      child: {
        learnerId: learner.learner_id,
        firstName: learner.first_name,
        lastName: learner.last_name,
        name: `${learner.first_name} ${learner.last_name}`,
        className: learner.class_name,
        gradeRange: learner.grade_range,
        canWalkHomeAlone: learner.can_walk_home_alone,
      },
      today: {
        date: today,
        status: todayRecord?.status ?? null,
        timeIn: hhmm(todayRecord?.time_in),
        signedOut: signOutOn(today),
      },
      attendance: {
        periodDays: ATTENDANCE_PERIOD_DAYS,
        presentDays,
        markedDays: attendance.length,
        percent: attendance.length ? Math.round((presentDays / attendance.length) * 100) : null,
      },
      week: attendance
        .filter((a) => a.record_date >= weekStart)
        .map((a) => ({ date: a.record_date, status: a.status, signedOut: signOutOn(a.record_date) })),
      pickups: pickups.map((p) => ({
        guardianId: p.guardian_id,
        fullName: p.full_name,
        relationship: p.relationship,
        isPrimaryContact: p.is_primary_contact,
        isYou: p.guardian_id === myGuardianId,
      })),
      teacher: teacher ? { name: teacher.full_name, email: teacher.contact_email } : null,
      observations: observations.map((o) => ({
        observationId: o.observation_id,
        date: o.record_date,
        category: o.category,
        rating: o.rating,
        notes: o.notes,
        teacherName: o.teacher_name,
      })),
    }
  }

  /**
   * A parent adds someone who may collect their child (they don't need an
   * account). The person is authorised straight away.
   *
   * @param {{ userId: number, learnerId: number, fullName: string, relationship: string,
   *   contactNumber: string, today: string }} params
   */
  async addPickup({ userId, learnerId, fullName, relationship, contactNumber, today }) {
    const myGuardianId = await this.#assertOwnsLearner(userId, learnerId)

    const current = await this.pickupPermissionRepository.findActiveByLearnerIds([learnerId])
    const name = fullName.trim()
    if (current.some((p) => p.full_name.trim().toLowerCase() === name.toLowerCase())) {
      throw httpError(`${name} is already on the pickup list.`, 409)
    }

    return this.runInTransaction(async ({ guardianRepository, pickupPermissionRepository }) => {
      const person = await guardianRepository.createPickupPerson({ fullName: name, relationship, contactNumber })
      await pickupPermissionRepository.create({
        learnerId,
        guardianId: person.guardian_id,
        isPrimaryContact: false,
        authorisedDate: today,
        addedByGuardianId: myGuardianId,
      })
      return {
        guardianId: person.guardian_id,
        fullName: person.full_name,
        relationship: person.relationship,
        isPrimaryContact: false,
        isYou: false,
      }
    })
  }

  /**
   * A parent gives, or takes back, permission for their child to walk home
   * alone. This is separate from who may collect the child.
   *
   * @param {{ userId: number, learnerId: number, canWalkHomeAlone: boolean }} params
   */
  async setWalkHome({ userId, learnerId, canWalkHomeAlone }) {
    await this.#assertOwnsLearner(userId, learnerId)
    await this.learnerRepository.update(learnerId, { can_walk_home_alone: canWalkHomeAlone })
    return { learnerId, canWalkHomeAlone }
  }

  /**
   * Activates or deactivates a guardian's account. Manager-only.
   * Deletion is intentionally not supported.
   */
  async setGuardianActive({ userId, guardianId, isActive }) {
    await this.#assertIsManager(userId)
    const updated = await this.guardianRepository.setActive(guardianId, isActive)
    if (!updated) {
      const err = new Error('Guardian not found')
      err.status = 404
      throw err
    }
    return updated
  }
}