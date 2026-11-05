// server/src/db/createMasterAdmin.js
// Creates ONE master admin (users + admins + managers rows) in a single transaction.
//   node src/db/createMasterAdmin.js            -> dry run, touches nothing
//   node src/db/createMasterAdmin.js --apply    -> creates the account
// Reads ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD from the environment.
// Against Azure, also set CONFIRM_PRODUCTION=yes.

import bcrypt from 'bcryptjs' // <- copy this import line from seedUsers.js if it differs

const apply = process.argv.includes('--apply')
const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
const fullName = (process.env.ADMIN_NAME ?? '').trim()
const password = process.env.ADMIN_PASSWORD ?? ''

if (!email || !fullName || password.length < 12) {
  console.error('Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD (at least 12 characters) first.')
  process.exit(1)
}

console.log(`Would create master admin: ${fullName} <${email}>`)
if (!apply) {
  console.log('Dry run only. Re-run with --apply to create it.')
  process.exit(0)
}

const { pool } = await import('./pool.js')

if (/azure\.com/i.test(process.env.DATABASE_URL ?? '') && process.env.CONFIRM_PRODUCTION !== 'yes') {
  console.error('DATABASE_URL points at Azure. Set CONFIRM_PRODUCTION=yes to confirm.')
  process.exit(1)
}

const client = await pool.connect()
try {
  const existing = await client.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email])
  if (existing.rowCount > 0) throw new Error('That email already exists. Nothing was changed.')

  const hash = await bcrypt.hash(password, 12)

  await client.query('BEGIN')
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, role, full_name, must_change_password)
     VALUES ($1, $2, 'admin', $3, true)
     RETURNING user_id`,
    [email, hash, fullName],
  )
  const userId = rows[0].user_id
  await client.query(
    `INSERT INTO admins (user_id, full_name, access_level) VALUES ($1, $2, 'master')`,
    [userId, fullName],
  )
  await client.query(`INSERT INTO managers (user_id, full_name) VALUES ($1, $2)`, [userId, fullName])
  await client.query('COMMIT')
  console.log(`Created master admin (user_id ${userId}). They must change the password at first login.`)
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Failed, nothing was written:', err.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}