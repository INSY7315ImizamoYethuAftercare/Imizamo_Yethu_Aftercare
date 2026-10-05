// A small but complete data set: one user per role, two families, learners,
// attendance, an observation. Shared by the role matrix, privacy and
// password_hash sweeps so each route has something real to act on.
import { pool } from '../../src/db/pool.js'
import { classIdByName, resetDb } from './db.js'
import { createAllRoles, createLearner, createUser, linkGuardian, markAttendance } from './factory.js'

export async function buildWorld() {
  await resetDb()
  const users = await createAllRoles()
  const { teacher, guardian } = users

  // Family A belongs to users.guardian; family B to another guardian.
  const learnerA = await createLearner({ className: 'Yellow', firstName: 'Aisha', lastName: 'Petersen' })
  const learnerFresh = await createLearner({ className: 'Yellow', firstName: 'Liam', lastName: 'Botha' })
  const otherGuardian = await createUser('guardian', { fullName: 'Other Guardian' })
  const learnerB = await createLearner({ className: 'Green', firstName: 'Zoe', lastName: 'Ntombela' })
  await linkGuardian(learnerA, guardian)
  await linkGuardian(learnerB, otherGuardian)

  const attendanceA = await markAttendance(learnerA, teacher)
  const { rows: [observationA] } = await pool.query(
    `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating", "notes")
     VALUES ($1, $2, CURRENT_DATE, 'Social', 7, 'Shares well') RETURNING "observation_id"`,
    [learnerA.learner_id, teacher.profile.teacher_id],
  )

  return {
    users,
    otherGuardian,
    learnerA,
    learnerB,
    learnerFresh,
    attendanceA,
    observationA,
    yellowId: await classIdByName('Yellow'),
    orangeId: await classIdByName('Orange'),
  }
}
