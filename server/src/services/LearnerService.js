/** YYYY-MM-DD minus n days, as YYYY-MM-DD (calendar arithmetic, no time zones). */
const daysBefore = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

const hhmm = (time) => (time ? String(time).slice(0, 5) : null);

// The learner profile shows attendance over this many days, and lists the
// most recent of them day by day.
export const PROFILE_PERIOD_DAYS = 30;
export const PROFILE_RECENT_DAYS = 14;

export class LearnerService {
  constructor({
    learnerRepository, schoolClassRepository, managerRepository, teacherRepository,
    attendanceRepository, signOutRepository, pickupPermissionRepository, observationRepository,
  }) {
    this.learnerRepository = learnerRepository;
    this.schoolClassRepository = schoolClassRepository;
    this.managerRepository = managerRepository;
    this.teacherRepository = teacherRepository;
    // Only needed for getLearnerOverview.
    this.attendanceRepository = attendanceRepository;
    this.signOutRepository = signOutRepository;
    this.pickupPermissionRepository = pickupPermissionRepository;
    this.observationRepository = observationRepository;
  }

  /**
   *
   * @param {*} userId
   * @returns
   */
  async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId);

    if (!manager) {
      const err = new Error("Only managers can manage learners");
      err.status = 403;
      throw err;
    }

    return manager;
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async listLearners({ userId }) {
    // Read-only: teachers and managers can both see every learner.
    const manager = await this.managerRepository.findByUserId(userId);
    const teacher = manager ? null : await this.teacherRepository?.findByUserId(userId);
    if (!manager && !teacher) {
      const err = new Error("Only teachers and managers can view learners");
      err.status = 403;
      throw err;
    }

    return this.learnerRepository.findAll();
  }

  /**
   * Retrieves a single learner by id. Same access as listLearners:
   * teachers and managers can both view any learner.
   *
   * @param {Object} params
   * @param {number} params.userId
   * @param {number} params.learnerId
   * @returns {Promise<Object>} The learner record.
   * @throws {Error} 403 if the caller is neither a teacher nor a manager.
   * @throws {Error} 404 if no learner exists with that id.
   */
  async getLearner({ userId, learnerId }) {
    const manager = await this.managerRepository.findByUserId(userId);
    const teacher = manager ? null : await this.teacherRepository?.findByUserId(userId);
    if (!manager && !teacher) {
      const err = new Error("Only teachers and managers can view learners");
      err.status = 403;
      throw err;
    }

    const learner = await this.learnerRepository.findById(learnerId);
    if (!learner) {
      const err = new Error("Learner not found");
      err.status = 404;
      throw err;
    }

    return learner;
  }

  /**
   * Everything the staff learner profile shows beyond the learner's own
   * details: attendance over the last 30 days, the most recent days (with who
   * collected them), who may collect them, and the teachers' observations.
   * Same access as getLearner: any teacher or manager.
   *
   * Pickups are names and relationships only, no contact details (POPIA),
   * the same as on the Sign-Out page.
   *
   * @param {{ userId: number, learnerId: number, today: string }} params - today is the SA date, YYYY-MM-DD
   */
  async getLearnerOverview({ userId, learnerId, today }) {
    const learner = await this.getLearner({ userId, learnerId });

    const periodStart = daysBefore(today, PROFILE_PERIOD_DAYS - 1);
    const [attendance, signOuts, pickups, observations] = await Promise.all([
      this.attendanceRepository.findByLearnerSince(learnerId, periodStart),
      this.signOutRepository.findByLearnerSince(learnerId, periodStart),
      this.pickupPermissionRepository.findActiveByLearnerIds([learnerId]),
      this.observationRepository.findByLearnerIdWithTeacher(learnerId),
    ]);

    const signOutOn = (date) => {
      const s = signOuts.find((o) => o.record_date === date);
      return s ? { timeOut: hhmm(s.time_out), collectedBy: s.guardian_name ?? "Walked home alone" } : null;
    };
    const presentDays = attendance.filter((a) => a.status === "present").length;

    return {
      learnerId: learner.learner_id,
      canWalkHomeAlone: learner.can_walk_home_alone,
      attendance: {
        periodDays: PROFILE_PERIOD_DAYS,
        presentDays,
        markedDays: attendance.length,
        // null when nothing has been marked yet, so the page can show "—" not 0%.
        percent: attendance.length ? Math.round((presentDays / attendance.length) * 100) : null,
      },
      // Newest first (the repository orders by date descending).
      recent: attendance.slice(0, PROFILE_RECENT_DAYS).map((a) => ({
        date: a.record_date,
        status: a.status,
        timeIn: hhmm(a.time_in),
        signedOut: signOutOn(a.record_date),
      })),
      pickups: pickups.map((p) => ({
        guardianId: p.guardian_id,
        fullName: p.full_name,
        relationship: p.relationship,
        isPrimaryContact: p.is_primary_contact,
      })),
      observations: observations.map((o) => ({
        observationId: o.observation_id,
        date: o.record_date,
        category: o.category,
        rating: o.rating,
        notes: o.notes,
        teacherName: o.teacher_name,
      })),
    };
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async createLearner({
    userId,
    classId,
    firstName,
    lastName,
    dateOfBirth,
    canWalkHomeAlone,
  }) {
    await this.#assertIsManager(userId);

    const schoolClass = await this.schoolClassRepository.findById(classId);

    if (!schoolClass) {
      const err = new Error("Class not found");
      err.status = 404;
      throw err;
    }

    if (schoolClass.is_active === false) {
      const err = new Error(`${schoolClass.class_name} has been removed. Choose another class.`);
      err.status = 409;
      throw err;
    }

    return this.learnerRepository.create({
      classId,
      firstName,
      lastName,
      dateOfBirth,
      canWalkHomeAlone,
    });
  }

  /**
   * This method updates a learner.
   * It enforces manager-only access.
   * If the update includes moving the learner to a different class,
   * validates that the new class exists.
   *
   * @param {Object} params
   * @param {number} params.userId - The unique identifier of the user making the update request.
   * @param {number} params.learnerId - The unique identifier of the learner to update.
   * @param {Object} params.fields - The fields to update.
   *
   * @returns {Promise<Object>} The updated learner record.
   *
   * @throws {Error} 404 if the learner does not exist.
   * @throws {Error} 404 if fields.class_id is provided and no class exists with that id.
   */
  async updateLearner({ userId, learnerId, fields }) {

    await this.#assertIsManager(userId)

    if (fields.class_id !== undefined) {
      const schoolClass = await this.schoolClassRepository.findById(fields.class_id)

      if (!schoolClass) {
        const err = new Error('Class not found')
        err.status = 404
        throw err
      }

      // A removed (deactivated) class can't take new learners.
      if (schoolClass.is_active === false) {
        const err = new Error(`${schoolClass.class_name} has been removed. Choose another class.`)
        err.status = 409
        throw err
      }
    }

    const updated = await this.learnerRepository.update(learnerId, fields)

    if (!updated) {
      const err = new Error('Learner not found')
      err.status = 404
      throw err
    }

    return updated
  }

    /**
   * This method deletes a learner.
   * It enforces manager-only access.
   * Returns 409 status code when the learner still has dependent records
   * (attendance, observations, pickup permissions, or sign-out records).
   *
   * @param {Object} params - The delete details
   * @param {number} params.userId - The unique identifier of the user making the delete request.
   * @param {number} params.learnerId - The unique identifier of the learner to delete.
   *
   * @throws {Error} 404 if no learner exists with the given learnerId.
   * @throws {Error} 409 if the learner still has dependent records.
   */
  async deleteLearner({ userId, learnerId }) {

    await this.#assertIsManager(userId)

    try {
      const deleted = await this.learnerRepository.delete(learnerId)

      if (!deleted) {
        const err = new Error('Learner not found')
        err.status = 404
        throw err
      }

    } catch (err) {
      if (err.code === '23503') {
        const conflictErr = new Error('Cant delete this learner - there are dependent records (attendance, observations, pickup permissions, or sign-outs) linked to this learner')
        conflictErr.status = 409
        throw conflictErr
      }

      throw err
    }
  }
}