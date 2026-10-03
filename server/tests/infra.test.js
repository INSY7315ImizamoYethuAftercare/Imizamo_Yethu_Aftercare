// Sanity checks for the test infrastructure itself.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from './helpers/app.js'
import { pool, resetDb } from './helpers/db.js'
import { ROLES, createUser } from './helpers/factory.js'

const app = await loadApp()

describe('test infrastructure', () => {
  beforeEach(resetDb)

  it('is connected to imizamo_test and nothing else', async () => {
    const { rows } = await pool.query('SELECT current_database() AS db')
    expect(rows[0].db).toBe('imizamo_test')
  })

  it('starts each test with only the 5 seeded classes', async () => {
    const { rows } = await pool.query('SELECT class_name FROM school_classes ORDER BY class_name')
    expect(rows.map((r) => r.class_name)).toEqual(['Blue', 'Green', 'Orange', 'Red', 'Yellow'])
    const users = await pool.query('SELECT COUNT(*)::int AS n FROM users')
    expect(users.rows[0].n).toBe(0)
  })

  it.each(ROLES)('factory creates a %s whose cookie /api/auth/me accepts', async (role) => {
    const u = await createUser(role)
    const res = await request(app).get('/api/auth/me').set('Cookie', u.cookie)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ userId: u.user.user_id, role: u.dbRole })
  })
})
