// server/src/db/seedLearners.js
// Seeds learners from the IY Learning Hub list (src/db/seed/learners.json).
//   node src/db/seedLearners.js            -> dry run, prints plan, touches nothing
//   node src/db/seedLearners.js --apply    -> inserts (one transaction, all-or-nothing)
// Safe to re-run: a learner with the same first name + last name + class is skipped.
// Against Azure, run with NODE_ENV=production so pool.js turns SSL on.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const apply = process.argv.includes('--apply')
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed', 'learners.json')
const learners = JSON.parse(readFileSync(file, 'utf8'))
// A missing date of birth is allowed (learners.date_of_birth is nullable).
// A date that IS given must be YYYY-MM-DD.
const dobPattern = /^\d{4}-\d{2}-\d{2}$/
const badDob = learners.filter(
  (l) => l.date_of_birth != null && l.date_of_birth !== '' && !dobPattern.test(l.date_of_birth),
)
if (badDob.length > 0) {
  console.error(`${badDob.length} learner(s) have a date_of_birth that is not "YYYY-MM-DD".`)
  process.exit(1)
}
const noDob = learners.filter((l) => l.date_of_birth == null || l.date_of_birth === '').length
if (noDob > 0) console.log(`${noDob} learner(s) have no date of birth (stored as NULL).`)

const counts = learners.reduce((m, l) => ((m[l.class_name] = (m[l.class_name] ?? 0) + 1), m), {})
console.log(`Loaded ${learners.length} learners:`, counts)

if (!apply) {
  console.log('Dry run only. Re-run with --apply to insert.')
  process.exit(0)
}

const { pool } = await import('./pool.js')

const targetsAzure = /azure\.com/i.test(process.env.DATABASE_URL ?? '')
if (targetsAzure && process.env.CONFIRM_PRODUCTION !== 'yes') {
  console.error(
    'DATABASE_URL points at Azure. Re-run with CONFIRM_PRODUCTION=yes to confirm you mean to write to it.',
  )
  process.exit(1)
}

const client = await pool.connect()
try {
  const { rows: classes } = await client.query(
    'SELECT class_id, class_name FROM school_classes WHERE is_active',
  )
  const classId = new Map(classes.map((c) => [c.class_name.toLowerCase(), c.class_id]))
  const missing = [...new Set(learners.map((l) => l.class_name))].filter(
    (n) => !classId.has(n.toLowerCase()),
  )
  if (missing.length) throw new Error(`Missing active class(es): ${missing.join(', ')}. Seed classes first.`)

  await client.query('BEGIN')
  let inserted = 0
  for (const l of learners) {
    const cid = classId.get(l.class_name.toLowerCase())
    const res = await client.query(
      `INSERT INTO learners (class_id, first_name, last_name, date_of_birth)
       SELECT $1::int, $2::varchar, $3::varchar, $4::date
       WHERE NOT EXISTS (
         SELECT 1 FROM learners
         WHERE class_id = $1::int
           AND LOWER(first_name) = LOWER($2::varchar)
           AND LOWER(last_name) = LOWER($3::varchar)
       )`,
      [cid, l.first_name, l.last_name, l.date_of_birth],
    )
    inserted += res.rowCount
  }
  await client.query('COMMIT')
  console.log(`Inserted ${inserted}, skipped ${learners.length - inserted} already present.`)
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Seed failed, nothing was written:', err.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}

