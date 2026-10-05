// Managers adding a class with its own colour, moving learners between
// classes, and removing a class once its learners have been moved out.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { classIdByName, pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser } from '../helpers/factory.js'

const app = await loadApp()

let manager
let teacher
let aisha
let liam
let yellowId
let greenId

beforeEach(async () => {
  await resetDb()
  manager = await createUser('manager')
  teacher = await createUser('teacher')
  aisha = await createLearner({ className: 'Yellow', firstName: 'Aisha', lastName: 'Petersen' })
  liam = await createLearner({ className: 'Yellow', firstName: 'Liam', lastName: 'Botha' })
  yellowId = await classIdByName('Yellow')
  greenId = await classIdByName('Green')
})

const move = (learner, classId, user = manager) =>
  request(app).patch(`/api/learners/${learner.learner_id}`).set('Cookie', user.cookie).send({ classId })
const removeClass = (classId) =>
  request(app).patch(`/api/classes/${classId}/deactivate`).set('Cookie', manager.cookie)
const classOf = async (learner) =>
  (await pool.query('SELECT "class_id" FROM learners WHERE "learner_id" = $1', [learner.learner_id])).rows[0].class_id

describe('Adding a class with a colour', () => {
  const add = (body) => request(app).post('/api/classes').set('Cookie', manager.cookie).send(body)

  it('saves the colour, and returns it on the class and its learners', async () => {
    const res = await add({ className: 'Brown', gradeRange: 'Gr 1-2', colour: '#9b5de5' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ class_name: 'Brown', grade_range: 'Gr 1-2', colour: '#9B5DE5' })

    const listed = (await request(app).get('/api/classes').set('Cookie', manager.cookie)).body
    expect(listed.find((c) => c.class_name === 'Brown').colour).toBe('#9B5DE5')

    await move(aisha, res.body.class_id)
    const learner = await request(app).get(`/api/learners/${aisha.learner_id}`).set('Cookie', manager.cookie)
    expect(learner.body).toMatchObject({ class_name: 'Brown', class_colour: '#9B5DE5' })
  })

  it('the colour is optional (the original classes have none)', async () => {
    const res = await add({ className: 'White', gradeRange: 'Gr 7' })
    expect(res.status).toBe(201)
    expect(res.body.colour).toBeNull()
    const yellow = (await request(app).get('/api/classes').set('Cookie', manager.cookie)).body.find((c) => c.class_name === 'Yellow')
    expect(yellow.colour).toBeNull()
  })

  it.each([['purple'], ['#FFF'], ['#GGGGGG'], [123], ['#FFD166; DROP TABLE x']])('refuses colour %p (400)', async (colour) => {
    const res = await add({ className: 'Brown', gradeRange: 'Gr 1-2', colour })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/hex colour/)
  })

  it('refuses a name already used by an active class, in any letter case (409)', async () => {
    expect((await add({ className: 'yellow', gradeRange: 'Gr 1-2', colour: '#FFD166' })).status).toBe(409)
  })

  it('a manager can change or clear a class colour', async () => {
    const changed = await request(app).patch(`/api/classes/${yellowId}`).set('Cookie', manager.cookie).send({ colour: '#06D6A0' })
    expect(changed.body.colour).toBe('#06D6A0')
    const cleared = await request(app).patch(`/api/classes/${yellowId}`).set('Cookie', manager.cookie).send({ colour: null })
    expect(cleared.body.colour).toBeNull()
  })

  it('a teacher cannot add a class (403)', async () => {
    const res = await request(app).post('/api/classes').set('Cookie', teacher.cookie)
      .send({ className: 'Brown', gradeRange: 'Gr 1-2', colour: '#9B5DE5' })
    expect(res.status).toBe(403)
  })
})

describe('Moving a learner to another class', () => {
  it('moves the learner, and the learner shows the new class', async () => {
    const res = await move(aisha, greenId)
    expect(res.status).toBe(200)
    expect(res.body.class_id).toBe(greenId)

    const shown = await request(app).get(`/api/learners/${aisha.learner_id}`).set('Cookie', manager.cookie)
    expect(shown.body).toMatchObject({ class_id: greenId, class_name: 'Green' })
  })

  it('keeps the learner\'s other details', async () => {
    await move(aisha, greenId)
    const { rows } = await pool.query('SELECT "first_name", "last_name", "is_active" FROM learners WHERE "learner_id" = $1', [aisha.learner_id])
    expect(rows[0]).toEqual({ first_name: 'Aisha', last_name: 'Petersen', is_active: true })
  })

  it('refuses a class that does not exist (404)', async () => {
    expect((await move(aisha, 999999)).status).toBe(404)
    expect(await classOf(aisha)).toBe(yellowId)
  })

  it('refuses a class that has been removed (409)', async () => {
    expect((await removeClass(greenId)).status).toBe(200)
    const res = await move(aisha, greenId)
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/Green has been removed/)
    expect(await classOf(aisha)).toBe(yellowId)
  })

  it('a teacher cannot move a learner (403)', async () => {
    expect((await move(aisha, greenId, teacher)).status).toBe(403)
    expect(await classOf(aisha)).toBe(yellowId)
  })
})

describe('Adding a learner to a removed class', () => {
  it('is refused (409)', async () => {
    await removeClass(greenId)
    const res = await request(app).post('/api/learners').set('Cookie', manager.cookie)
      .send({ classId: greenId, firstName: 'New', lastName: 'Learner' })
    expect(res.status).toBe(409)
  })
})

describe('Removing a class that still has learners', () => {
  it('is blocked until they are moved, then works', async () => {
    expect((await removeClass(yellowId)).status).toBe(409)

    expect((await move(aisha, greenId)).status).toBe(200)
    expect((await removeClass(yellowId)).status).toBe(409) // Liam is still there

    expect((await move(liam, greenId)).status).toBe(200)
    expect((await removeClass(yellowId)).status).toBe(200)

    const classes = await request(app).get('/api/classes').set('Cookie', manager.cookie)
    const names = classes.body.map((c) => c.class_name)
    expect(names).not.toContain('Yellow')
    expect(classes.body.find((c) => c.class_name === 'Green').learner_count).toBe(2)
  })
})
