// repositories/AttendanceRepository.js

class AttendanceRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool;
    }

    /**
     * Retrieves the full attendance history for a single learner.
     * 
     * @param {number} learnerId - The unique identifier of the learner.
     * @returns {Promise<Array<Object>>} A list of attendance records for the 
     * learner, ordered for most recent to oldest. 
     */
    async findByLearnerId(learnerId) {
        const result = await this.pool.query(
            `SELECT "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"
            FROM attendance_records
            WHERE "learner_id" = $1 ORDER BY "record_date" DESC`,
            [learnerId]
        );
        return result.rows;
    }

    /**
     * Retrieves attendance records for every learner in a specific class on a given date.
     * It joins against the learners table since attendance
     * records only store a learnerID, not a classID directly.
     * 
     * @param {number} classId - The unique identifier of the class.
     * @param {string} date - The date to filter attendance records with the format YYYY-MM-DD. 
     * @returns {Promise<Array<Object>>} A list of attendance records for learners
     * in the specified class on the given date.
     */
    async findByClassAndDate(classId, date) {
        // Joins against learners to scope by class, since attendance rows only carry learnerID
        const result = await this.pool.query(
        `SELECT ar."record_id", ar."learner_id", ar."record_date", ar."time_in", ar."status" 
        FROM attendance_records ar
        JOIN learners l ON l."learner_id" = ar."learner_id"
        WHERE l."class_id" = $1 AND ar."record_date" = $2`,
        [classId, date]
    );
    return result.rows;
    }

     /**
     * Creates a new attendance record marking a learner as present. Called
     * exclusively by a Teacher during the daily attendance-marking flow.
     *
     * @param {Object} params - The attendance details.
     * @param {number} params.learnerId - The unique identifier of the learner.
     * @param {number} params.teacherId - The unique identifier of the teacher recording the attendance.
     * @param {string} params.recordDate - The date attendance is being recorded for (format: YYYY-MM-DD).
     * @param {string} params.timeIn - The time the learner arrived.
     * @returns {Promise<Object>} The newly created attendance record.
     */
    async markPresent({ learnerId, teacherId, recordDate, timeIn }) {
        const result = await this.pool.query(
            `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "time_in", "status")
            VALUES ($1, $2, $3, $4, 'present')
            RETURNING "learner_id", "teacher_id", "record_date", "time_in", "status"`,
            [learnerId, teacherId, recordDate, timeIn]
        );
        return result.rows[0];
    }

    /**
     * Creates a new attendance record marking a learner as absent. No
     * timeIn is recorded, since the learner did not arrive.
     *
     * @param {Object} params - The attendance details.
     * @param {number} params.learnerId - The unique identifier of the learner.
     * @param {number} params.teacherId - The unique identifier of the
     * teacher recording the attendance.
     * @param {string} params.recordDate - The date attendance is being recorded for (format: YYYY-MM-DD).
     * @returns {Promise<Object>} The newly created attendance record.
     */
    async markAbsent({ learnerId, teacherId, recordDate }) {
        const result = await this.pool.query(
            `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "status")
             VALUES ($1, $2, $3, 'absent')
             RETURNING "record_id", "learner_id", "teacher_id", "record_date", "status"`,
            [learnerId, teacherId, recordDate]
        );
        return result.rows[0];
    }
}

export default AttendanceRepository;