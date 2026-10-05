// server/src/db/seedDemo.js
// Realistic DUMMY data for demos and the e2e walkthrough (#54): every role,
// all 5 classes, learners, guardians, pickup permissions, today's attendance,
// observations, a sign-out and a donor report.
//
//   npm run seed:demo                  -> dry run, prints what would be created
//   npm run seed:demo -- --apply       -> creates it (one transaction)
//   npm run seed:demo -- --apply --reset
//                                      -> empties every table first, then seeds
//
// LOCAL ONLY: refuses to run unless DATABASE_URL is localhost and the
// database is imizamo_dev or imizamo_test. Never point this at Azure.
// Every account uses SEED_PASSWORD, or the demo password printed below.
// All names are fictional and all emails use the reserved .test domain.

import bcrypt from 'bcryptjs'

const apply = process.argv.includes('--apply')
const reset = process.argv.includes('--reset')
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'Demo-Password-2026!'
const DOMAIN = 'iylh.test'

const STAFF = [
  { role: 'admin', accessLevel: 'master', fullName: 'Nomvula Dube', email: `master.admin@${DOMAIN}` },
  { role: 'admin', accessLevel: 'standard', fullName: 'Pieter Jacobs', email: `admin@${DOMAIN}` },
  { role: 'manager', fullName: 'Sarah Botha', email: `manager@${DOMAIN}` },
  { role: 'teacher', fullName: 'Thandeka Nkosi', email: `t.nkosi@${DOMAIN}`, class: 'Yellow' },
  { role: 'teacher', fullName: 'Sipho Dlamini', email: `s.dlamini@${DOMAIN}`, class: 'Green' },
  { role: 'teacher', fullName: 'Megan Williams', email: `m.williams@${DOMAIN}`, class: 'Red' },
  { role: 'teacher', fullName: 'Ravi Naidoo', email: `r.naidoo@${DOMAIN}`, class: 'Blue' },
  { role: 'teacher', fullName: 'Aaliyah Patel', email: `a.patel@${DOMAIN}`, class: 'Orange' },
]

// [class, first, last, date of birth, can walk home alone, active]
const LEARNERS = [
  ['Orange', 'Lwazi', 'Mthembu', '2020-02-11', false, true],
  ['Orange', 'Chloe', 'Adams', '2020-06-30', false, true],
  ['Yellow', 'Aisha', 'Petersen', '2018-03-14', false, true],
  ['Yellow', 'Liam', 'van der Berg', '2018-09-02', false, true],
  ['Yellow', 'Amahle', 'Zulu', '2019-01-21', false, true],
  ['Green', 'Keanu', 'Abrahams', '2016-11-05', false, true],
  ['Green', 'Zoe', 'Ntombela', '2016-04-17', false, true],
  ['Green', 'Ethan', 'Fortuin', '2017-02-08', false, false],
  ['Red', 'Naledi', 'Mokoena', '2014-08-23', true, true],
  ['Red', 'Daniel', 'Smit', '2015-05-12', false, true],
  ['Red', 'Imaan', 'Hendricks', '2014-12-01', true, true],
  ['Blue', 'Bongani', 'Khumalo', '2013-03-29', true, true],
  ['Blue', 'Leah', 'September', '2013-10-10', false, true],
]

// Guardians and who they may collect (by "First Last"); first is primary contact.
const GUARDIANS = [
  { fullName: 'Fatima Petersen', email: `fatima.petersen@${DOMAIN}`, contact: '0821234567', relationship: 'Mother',
    children: ['Aisha Petersen'] },
  { fullName: 'Ahmed Petersen', email: `ahmed.petersen@${DOMAIN}`, contact: '0827654321', relationship: 'Father',
    children: ['Aisha Petersen'], secondary: true },
  { fullName: 'Grace Ntombela', email: `grace.ntombela@${DOMAIN}`, contact: '0739876543', relationship: 'Grandmother',
    children: ['Zoe Ntombela'] },
  { fullName: 'Thabo Mokoena', email: `thabo.mokoena@${DOMAIN}`, contact: '0614445555', relationship: 'Father',
    children: ['Naledi Mokoena', 'Lwazi Mthembu'] },
  { fullName: 'Karen van der Berg', email: `karen.vdberg@${DOMAIN}`, contact: '0845556666', relationship: 'Mother',
    children: ['Liam van der Berg'], inactive: true },
]

// Today's register (SA date): present unless listed as absent; not listed = not marked yet.
const PRESENT_TODAY = ['Aisha Petersen', 'Liam van der Berg', 'Zoe Ntombela', 'Keanu Abrahams', 'Naledi Mokoena', 'Bongani Khumalo', 'Lwazi Mthembu']
const ABSENT_TODAY = ['Amahle Zulu', 'Daniel Smit']
const SIGNED_OUT_TODAY = { learner: 'Bongani Khumalo', guardian: null, time: '16:10:00' } // walks home alone

const OBSERVATIONS = [
  ['Aisha Petersen', 'Social', 8, 'Shares well and helps younger learners.'],
  ['Aisha Petersen', 'Reading', 6, 'Reading short sentences with support.'],
  ['Zoe Ntombela', 'Maths', 7, 'Confident with times tables up to 5.'],
  ['Naledi Mokoena', 'Homework', 9, 'Completes homework independently.'],
  ['Keanu Abrahams', 'Behaviour', 5, 'Needed reminders to stay on task this week.'],
]

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })

function assertLocalDatabase(url) {
  if (!url) throw new Error('DATABASE_URL is not set.')
  const parsed = new URL(url)
  const db = parsed.pathname.replace(/^\//, '')
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname) || !['imizamo_dev', 'imizamo_test'].includes(db)) {
    throw new Error(`Refusing to seed demo data into ${parsed.hostname}/${db}. Local imizamo_dev or imizamo_test only.`)
  }
  return `${parsed.hostname}/${db}`
}

const { env } = await import('../config/env.js')
const target = assertLocalDatabase(env.databaseUrl)

console.log(`Target: ${target}`)
console.log(`${STAFF.length} staff, ${GUARDIANS.length} guardians, ${LEARNERS.length} learners, ${OBSERVATIONS.length} observations`)
if (!apply) {
  console.log('\nDry run only. Re-run with --apply (add --reset to empty the tables first).')
  process.exit(0)
}

const { pool } = await import('./pool.js')
const client = await pool.connect()
try {
  await client.query('BEGIN')

  if (reset) {
    // school_classes references teachers, so it has to go too; put back the
    // same 5 classes schema.sql seeds.
    await client.query(`TRUNCATE sign_out_records, attendance_records, development_observations, pickup_permissions,
      donor_reports, learners, school_classes, guardians, teachers, managers, admins, users RESTART IDENTITY CASCADE`)
    await client.query(`INSERT INTO school_classes ("class_name", "grade_range", "teacher_id") VALUES
      ('Yellow', 'Gr 1-2', NULL), ('Green', 'Gr 3-4', NULL), ('Red', 'Gr 5-6', NULL), ('Blue', 'Gr 7', NULL), ('Orange', 'Gr R', NULL)`)
  } else {
    const existing = await client.query(`SELECT 1 FROM users WHERE "email" LIKE $1 LIMIT 1`, [`%@${DOMAIN}`])
    if (existing.rowCount > 0) {
      throw new Error(`Demo accounts (@${DOMAIN}) already exist. Re-run with --apply --reset to rebuild them.`)
    }
  }

  const { rows: classRows } = await client.query('SELECT "class_id", "class_name" FROM school_classes WHERE "is_active"')
  const classId = Object.fromEntries(classRows.map((c) => [c.class_name, c.class_id]))
  for (const name of ['Yellow', 'Green', 'Red', 'Blue', 'Orange']) {
    if (!classId[name]) throw new Error(`Class "${name}" is missing. Run schema.sql first.`)
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const createUser = async ({ email, role, fullName, isActive = true }) =>
    (await client.query(
      `INSERT INTO users ("email", "role", "password_hash", "full_name", "is_active")
       VALUES ($1, $2, $3, $4, $5) RETURNING "user_id"`,
      [email, role, hash, fullName, isActive],
    )).rows[0].user_id

  let managerId
  const teacherIdByClass = {}
  for (const s of STAFF) {
    const userId = await createUser(s)
    if (s.role === 'admin') {
      await client.query(`INSERT INTO admins ("user_id", "full_name", "access_level") VALUES ($1, $2, $3)`, [userId, s.fullName, s.accessLevel])
      // A master admin can do everything a manager can (migration 004).
      if (s.accessLevel === 'master') {
        await client.query(`INSERT INTO managers ("user_id", "full_name") VALUES ($1, $2)`, [userId, s.fullName])
      }
    } else if (s.role === 'manager') {
      managerId = (await client.query(
        `INSERT INTO managers ("user_id", "full_name") VALUES ($1, $2) RETURNING "manager_id"`, [userId, s.fullName],
      )).rows[0].manager_id
    } else {
      const teacherId = (await client.query(
        `INSERT INTO teachers ("user_id", "full_name", "contact_email") VALUES ($1, $2, $3) RETURNING "teacher_id"`,
        [userId, s.fullName, s.email],
      )).rows[0].teacher_id
      teacherIdByClass[s.class] = teacherId
      await client.query(`UPDATE school_classes SET "teacher_id" = $1 WHERE "class_id" = $2`, [teacherId, classId[s.class]])
    }
  }

  const learnerId = {}
  for (const [cls, first, last, dob, walks, active] of LEARNERS) {
    learnerId[`${first} ${last}`] = (await client.query(
      `INSERT INTO learners ("class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone", "is_active")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING "learner_id"`,
      [classId[cls], first, last, dob, walks, active],
    )).rows[0].learner_id
  }
  const learnerClass = Object.fromEntries(LEARNERS.map(([cls, f, l]) => [`${f} ${l}`, cls]))

  for (const g of GUARDIANS) {
    const userId = await createUser({ email: g.email, role: 'guardian', fullName: g.fullName, isActive: !g.inactive })
    const guardianId = (await client.query(
      `INSERT INTO guardians ("user_id", "full_name", "contact_number", "relationship", "claimed_learner_name")
       VALUES ($1, $2, $3, $4, $5) RETURNING "guardian_id"`,
      [userId, g.fullName, g.contact, g.relationship, g.children[0]],
    )).rows[0].guardian_id
    for (const child of g.children) {
      await client.query(
        `INSERT INTO pickup_permissions ("learner_id", "guardian_id", "is_primary_contact") VALUES ($1, $2, $3)`,
        [learnerId[child], guardianId, !g.secondary],
      )
    }
  }

  const date = today()
  const teacherFor = (name) => teacherIdByClass[learnerClass[name]]
  for (const name of PRESENT_TODAY) {
    await client.query(
      `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "time_in", "status") VALUES ($1, $2, $3, '14:05:00', 'present')`,
      [learnerId[name], teacherFor(name), date],
    )
  }
  for (const name of ABSENT_TODAY) {
    await client.query(
      `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "status") VALUES ($1, $2, $3, 'absent')`,
      [learnerId[name], teacherFor(name), date],
    )
  }

  // A sign-out needs a guardian; the walk-home learner is recorded against
  // Thabo Mokoena's account only if a guardian is required by the schema.
  const { rows: [thabo] } = await client.query(
    `SELECT g."guardian_id" FROM guardians g JOIN users u ON u."user_id" = g."user_id" WHERE u."email" = $1`,
    [`thabo.mokoena@${DOMAIN}`],
  )
  const { rows: [{ is_nullable: guardianNullable }] } = await client.query(
    `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'sign_out_records' AND column_name = 'guardian_id'`,
  )
  const signOutGuardian = SIGNED_OUT_TODAY.guardian ?? (guardianNullable === 'YES' ? null : thabo.guardian_id)
  await client.query(
    `INSERT INTO sign_out_records ("learner_id", "teacher_id", "guardian_id", "record_date", "time_out") VALUES ($1, $2, $3, $4, $5)`,
    [learnerId[SIGNED_OUT_TODAY.learner], teacherFor(SIGNED_OUT_TODAY.learner), signOutGuardian, date, SIGNED_OUT_TODAY.time],
  )

  // A pickup person Fatima registered herself (no login account), and a few
  // days of history for Aisha so the parent page's "This Week" isn't empty.
  const guardianIdByName = Object.fromEntries(
    (await client.query('SELECT "guardian_id", "full_name" FROM guardians')).rows.map((g) => [g.full_name, g.guardian_id]),
  )
  const { rows: [zainab] } = await client.query(
    `INSERT INTO guardians ("user_id", "full_name", "contact_number", "relationship")
     VALUES (NULL, 'Zainab Hendricks', '0723456789', 'Aunt') RETURNING "guardian_id"`,
  )
  guardianIdByName['Zainab Hendricks'] = zainab.guardian_id
  await client.query(
    `INSERT INTO pickup_permissions ("learner_id", "guardian_id", "is_primary_contact", "added_by_guardian_id") VALUES ($1, $2, false, $3)`,
    [learnerId['Aisha Petersen'], zainab.guardian_id, guardianIdByName['Fatima Petersen']],
  )
  // [days before today, status, collected by, time out]
  const AISHA_HISTORY = [
    [1, 'present', 'Zainab Hendricks', '17:00:00'],
    [2, 'present', 'Fatima Petersen', '17:15:00'],
    [3, 'absent'],
    [4, 'present', 'Ahmed Petersen', '17:45:00'],
  ]
  for (const [daysAgo, status, collector, timeOut] of AISHA_HISTORY) {
    await client.query(
      `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "time_in", "status")
       VALUES ($1, $2, $3::date - $4::int, $5, $6)`,
      [learnerId['Aisha Petersen'], teacherFor('Aisha Petersen'), date, daysAgo, status === 'present' ? '14:00:00' : null, status],
    )
    if (collector) {
      await client.query(
        `INSERT INTO sign_out_records ("learner_id", "teacher_id", "guardian_id", "record_date", "time_out")
         VALUES ($1, $2, $3, $4::date - $5::int, $6)`,
        [learnerId['Aisha Petersen'], teacherFor('Aisha Petersen'), guardianIdByName[collector], date, daysAgo, timeOut],
      )
    }
  }

  for (const [name, category, rating, notes] of OBSERVATIONS) {
    await client.query(
      `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating", "notes")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [learnerId[name], teacherFor(name), date, category, rating, notes],
    )
  }

  await client.query(
    `INSERT INTO donor_reports ("manager_id", "period_start", "period_end") VALUES ($1, $2, $3)`,
    [managerId, `${date.slice(0, 4)}-01-01`, date],
  )

  await client.query('COMMIT')

  console.log(`\nDemo data created in ${target}. Every account's password: ${DEMO_PASSWORD}`)
  console.log('\n  Role              Email')
  for (const s of STAFF) {
    const label = s.role === 'admin' ? `admin (${s.accessLevel})` : s.role
    console.log(`  ${label.padEnd(17)} ${s.email}${s.class ? `   (${s.class} class)` : ''}`)
  }
  for (const g of GUARDIANS) {
    console.log(`  ${'guardian'.padEnd(17)} ${g.email}${g.inactive ? '   (DEACTIVATED)' : ''}`)
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Failed, nothing was written:', err.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
