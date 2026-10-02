// server/src/db/seedUsers.js
// Creates the first staff accounts (one manager + teachers) so you can log in.
//   node src/db/seedUsers.js            -> dry run, shows who would be created
//   node src/db/seedUsers.js --apply    -> creates them (one transaction)
//
// EDIT THE STAFF LIST BELOW to the real names and emails first.
// Passwords are generated randomly and printed ONCE in the terminal; only a
// bcrypt hash is stored. Copy them somewhere safe, then change them later.
// To use one shared password instead (e.g. for a demo), run with
//   SEED_PASSWORD="something-long" node src/db/seedUsers.js --apply
//
// Safe to re-run: an email that already exists is skipped.
// Against Azure, set DB_SSL=true (or NODE_ENV=production) so the connection uses SSL.

import { randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'

const STAFF = [
  { role: 'manager', fullName: 'Sarah Botha', email: 'sarah.botha@iylh.org' },
  { role: 'teacher', fullName: 'Ms Nkosi', email: 'nkosi@iylh.org', class: 'Yellow' },
  { role: 'teacher', fullName: 'Mr Dlamini', email: 'dlamini@iylh.org', class: 'Green' },
  { role: 'teacher', fullName: 'Ms Williams', email: 'williams@iylh.org', class: 'Red' },
  { role: 'teacher', fullName: 'Mr Naidoo', email: 'naidoo@iylh.org', class: 'Blue' },
  { role: 'teacher', fullName: 'Ms Patel', email: 'patel@iylh.org', class: 'Orange' },
]

const apply = process.argv.includes('--apply')

// No look-alike characters (0/O, 1/l/I) so passwords are easy to copy.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const generatePassword = (length = 14) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

const sharedPassword = process.env.SEED_PASSWORD
if (sharedPassword && sharedPassword.length < 8) {
  console.error('SEED_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

const emails = STAFF.map((s) => s.email.toLowerCase())
if (new Set(emails).size !== emails.length) {
  console.error('Two staff entries share the same email. Fix the STAFF list.')
  process.exit(1)
}

console.log(`${STAFF.length} accounts in the list:`)
for (const s of STAFF) console.log(`  ${s.role.padEnd(8)} ${s.fullName.padEnd(14)} ${s.email}${s.class ? `  -> ${s.class} class` : ''}`)

if (!apply) {
  console.log('\nDry run only. Re-run with --apply to create them.')
  process.exit(0)
}

const { pool } = await import('./pool.js')
const client = await pool.connect()
const created = []
const skipped = []
try {
  await client.query('BEGIN')
  for (const s of STAFF) {
    const existing = await client.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [s.email])
    if (existing.rowCount > 0) {
      skipped.push(s.email)
      continue
    }

    const password = sharedPassword ?? generatePassword()
    const hash = await bcrypt.hash(password, 10)

    const u = await client.query(
      `INSERT INTO users (email, role, password_hash, full_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING user_id`,
      [s.email, s.role, hash, s.fullName],
    )
    const userId = u.rows[0].user_id

    if (s.role === 'manager') {
      await client.query('INSERT INTO managers (user_id, full_name) VALUES ($1, $2)', [userId, s.fullName])
    } else {
      const t = await client.query(
        'INSERT INTO teachers (user_id, full_name, contact_email) VALUES ($1, $2, $3) RETURNING teacher_id',
        [userId, s.fullName, s.email],
      )
      if (s.class) {
        // Only fills an empty slot: never takes a class away from another teacher.
        await client.query(
          `UPDATE school_classes SET teacher_id = $1
           WHERE LOWER(class_name) = LOWER($2) AND is_active AND teacher_id IS NULL`,
          [t.rows[0].teacher_id, s.class],
        )
      }
    }
    created.push({ ...s, password })
  }
  await client.query('COMMIT')

  console.log(`\nCreated ${created.length}, skipped ${skipped.length} that already exist.`)
  if (created.length > 0) {
    console.log(sharedPassword ? '\nAll new accounts use the SEED_PASSWORD you supplied.' : '\nPasswords (shown once, copy them now):')
    if (!sharedPassword) for (const c of created) console.log(`  ${c.email.padEnd(28)} ${c.password}`)
  }
  if (skipped.length > 0) console.log('Skipped:', skipped.join(', '))
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Failed, nothing was written:', err.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
