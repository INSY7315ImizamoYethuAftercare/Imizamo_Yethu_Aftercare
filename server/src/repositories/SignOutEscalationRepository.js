// repositories/SignOutEscalationRepository.js

// The queue's columns, with names and South African times ready to show.
const SELECT_ROW = `
  SELECT e."escalation_id", e."learner_id", e."record_date"::text AS "record_date", e."collector_name", e."status",
         l."first_name", l."last_name", c."class_name",
         COALESCE(t."full_name", rm."full_name") AS "raised_by_name",
         to_char(e."raised_at" AT TIME ZONE 'Africa/Johannesburg', 'HH24:MI') AS "raised_time",
         vm."full_name" AS "resolved_by_name",
         to_char(e."resolved_at" AT TIME ZONE 'Africa/Johannesburg', 'HH24:MI') AS "resolved_time"
  FROM signout_escalations e
  JOIN learners l ON l."learner_id" = e."learner_id"
  LEFT JOIN school_classes c ON c."class_id" = l."class_id"
  LEFT JOIN teachers t ON t."teacher_id" = e."raised_by_teacher_id"
  LEFT JOIN managers rm ON rm."manager_id" = e."raised_by_manager_id"
  LEFT JOIN managers vm ON vm."manager_id" = e."resolved_by_manager_id"`

class SignOutEscalationRepository {
  constructor(pool) {
    this.pool = pool
  }

  /**
   * Adds a collection to the queue. Fails with a unique violation (23505) if
   * the learner is already waiting in it today.
   *
   * @param {{ learnerId: number, recordDate: string, collectorName: string|null,
   *   teacherId: number|null, managerId: number|null }} params
   * @returns {Promise<Object>} The new row, as findById returns it.
   */
  async create({ learnerId, recordDate, collectorName, teacherId, managerId }) {
    const result = await this.pool.query(
      `INSERT INTO signout_escalations ("learner_id", "record_date", "collector_name", "raised_by_teacher_id", "raised_by_manager_id")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "escalation_id"`,
      [learnerId, recordDate, collectorName, teacherId, managerId],
    )
    return this.findById(result.rows[0].escalation_id)
  }

  async findById(escalationId) {
    const result = await this.pool.query(`${SELECT_ROW} WHERE e."escalation_id" = $1`, [escalationId])
    return result.rows[0] || null
  }

  /**
   * One day's queue, oldest first. An open request is left out once the
   * learner has gone, e.g. an authorised parent arrived in the meantime.
   *
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Array<Object>>}
   */
  async findByDate(date) {
    const result = await this.pool.query(
      `${SELECT_ROW}
       WHERE e."record_date" = $1
         AND NOT (e."status" = 'open' AND EXISTS (
           SELECT 1 FROM sign_out_records s WHERE s."learner_id" = e."learner_id" AND s."record_date" = e."record_date"
         ))
       ORDER BY e."raised_at", e."escalation_id"`,
      [date],
    )
    return result.rows
  }

  /**
   * Closes a request that is still open. Doing it in one statement means two
   * managers can't both act on the same request.
   *
   * @param {{ escalationId: number, status: 'approved'|'dismissed', managerId: number }} params
   * @returns {Promise<Object|null>} The closed row, or null if it wasn't open.
   */
  async resolve({ escalationId, status, managerId }) {
    const result = await this.pool.query(
      `UPDATE signout_escalations
       SET "status" = $2, "resolved_by_manager_id" = $3, "resolved_at" = now()
       WHERE "escalation_id" = $1 AND "status" = 'open'
       RETURNING "escalation_id", "learner_id", "record_date"::text AS "record_date", "collector_name", "status"`,
      [escalationId, status, managerId],
    )
    return result.rows[0] || null
  }
}

export default SignOutEscalationRepository
