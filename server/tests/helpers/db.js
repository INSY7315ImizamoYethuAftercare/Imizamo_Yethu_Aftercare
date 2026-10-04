// Database helpers for integration tests. Always talks to imizamo_test via
// the app's own pool (DATABASE_URL is set by tests/setup-env.js).
import { pool } from '../../src/db/pool.js'

export { pool }

const TABLES = [
  'sign_out_records',
  'attendance_records',
  'development_observations',
  'pickup_permissions',
  'donor_reports',
  'learners',
  'school_classes',
  'guardians',
  'teachers',
  'managers',
  'admins',
  'users',
]

// Same rows schema.sql seeds, so every test starts from a known state.
const SEED_CLASSES = `
  INSERT INTO school_classes (class_name, grade_range, teacher_id) VALUES
    ('Yellow', 'Gr 1-2', NULL),
    ('Green',  'Gr 3-4', NULL),
    ('Red',    'Gr 5-6', NULL),
    ('Blue',   'Gr 7',   NULL),
    ('Orange', 'Gr R',   NULL)`

/** Empties every table and re-seeds the 5 classes. Call from beforeEach/beforeAll. */
export async function resetDb() {
  await pool.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`)
  await pool.query(SEED_CLASSES)
}

/** class_id of a seeded class by name ("Yellow", "Green", ...). */
export async function classIdByName(name) {
  const { rows } = await pool.query(
    'SELECT class_id FROM school_classes WHERE LOWER(class_name) = LOWER($1) AND is_active',
    [name],
  )
  return rows[0]?.class_id
}

/**
 * Runs fn while every INSERT into `table` fails inside Postgres with
 * `message`: a real database error, for testing 500 handling and rollbacks.
 * The trigger is always removed afterwards. Test database only.
 */
export async function withFailingInsert(table, message, fn) {
  if (!/^[a-z_]+$/.test(table)) throw new Error(`Bad table name: ${table}`)
  await pool.query(`CREATE OR REPLACE FUNCTION test_force_failure() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION '%', TG_ARGV[0]; END $$`)
  await pool.query(`CREATE TRIGGER test_force_failure BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION test_force_failure('${message.replaceAll("'", "''")}')`)
  try {
    return await fn()
  } finally {
    await pool.query(`DROP TRIGGER IF EXISTS test_force_failure ON ${table}`)
  }
}
