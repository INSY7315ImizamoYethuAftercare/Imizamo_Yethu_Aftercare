class TeacherAccountRepository {
  constructor(pool) {
    this.pool = pool
  }

  async create({ email, passwordHash, fullName }) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const u = await client.query(
        `INSERT INTO users ("email", "role", "password_hash", "full_name")
         VALUES ($1, 'teacher', $2, $3) RETURNING "user_id"`,
        [email, passwordHash, fullName],
      )
      const t = await client.query(
        `INSERT INTO teachers ("user_id", "full_name", "contact_email")
         VALUES ($1, $2, $3)
         RETURNING "teacher_id", "user_id", "full_name", "contact_email"`,
        [u.rows[0].user_id, fullName, email],
      )
      await client.query('COMMIT')
      return { ...t.rows[0], is_active: true }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async findAll() {
    const result = await this.pool.query(
      `SELECT t."teacher_id", t."user_id", t."full_name", t."contact_email", u."is_active"
       FROM teachers t JOIN users u ON u."user_id" = t."user_id"
       ORDER BY t."full_name"`,
    )
    return result.rows
  }

  async setActive(teacherId, isActive) {
    const result = await this.pool.query(
      `UPDATE users u SET "is_active" = $2, "updated_at" = now()
       FROM teachers t
       WHERE t."user_id" = u."user_id" AND t."teacher_id" = $1
       RETURNING t."teacher_id", u."is_active"`,
      [teacherId, isActive],
    )
    return result.rows[0] || null
  }
}

export default TeacherAccountRepository