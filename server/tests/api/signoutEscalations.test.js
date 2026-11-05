// The manager's sign-out queue: collections staff couldn't verify wait here,
// and nothing is signed out until a manager approves.
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { pool, resetDb } from '../helpers/db.js'
import { createLearner, createUser, linkGuardian, markAttendance } from '../helpers/factory.js'

const app = await loadApp()

let teacher
let manager
let guardian
let learner

beforeEach(async () => {
  await resetDb()
  teacher = await createUser('teacher', { fullName: 'Thandeka Nkosi' })
  manager = await createUser('manager', { fullName: 'Sarah Botha' })
  guardian = await createUser('guardian', { fullName: 'Fatima Petersen' })
  learner = await createLearner({ className: 'Yellow', firstName: 'Aisha', lastName: 'Petersen', canWalkHomeAlone: false })
  await linkGuardian(learner, guardian)
  await markAttendance(learner, teacher)
})

const raise = (body, user = teacher) =>
  request(app).post('/api/signout/escalations').set('Cookie', user.cookie).send(body)
const list = (user = manager) => request(app).get('/api/signout/escalations').set('Cookie', user.cookie)
const decide = (id, action, user = manager) =>
  request(app).patch(`/api/signout/escalations/${id}`).set('Cookie', user.cookie).send({ action })
const today = (user = manager) => request(app).get('/api/signout/today').set('Cookie', user.cookie)
const signOutCount = async () => (await pool.query('SELECT COUNT(*)::int AS n FROM sign_out_records')).rows[0].n
const STRANGER = () => ({ learnerId: learner.learner_id, collectorName: '  Random Stranger ' })

describe('POST /api/signout/escalations', () => {
  it('adds the collection to the queue without signing the learner out', async () => {
    const res = await raise(STRANGER())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      learnerName: 'Aisha Petersen', className: 'Yellow', collectorName: 'Random Stranger', raisedBy: 'Thandeka Nkosi', status: 'open',
    })
    expect(res.body.raisedAt).toMatch(/^\d{2}:\d{2}$/)
    expect(await signOutCount()).toBe(0)
  })

  it('takes a learner walking home without permission', async () => {
    const res = await raise({ learnerId: learner.learner_id, collectorName: null })
    expect(res.status).toBe(201)
    expect(res.body.collectorName).toBeNull()
  })

  it('refuses a walk-home request for a learner who is allowed to walk home', async () => {
    const walker = await createLearner({ className: 'Yellow', firstName: 'Naledi', lastName: 'Mokoena', canWalkHomeAlone: true })
    await markAttendance(walker, teacher)
    const res = await raise({ learnerId: walker.learner_id, collectorName: null })
    expect(res.status).toBe(409)
  })

  it('queues a learner only once at a time', async () => {
    await raise(STRANGER())
    const res = await raise(STRANGER())
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/already waiting/)
  })

  it('refuses a learner who is not present today', async () => {
    const absentee = await createLearner({ className: 'Yellow', firstName: 'Not', lastName: 'Here' })
    const res = await raise({ learnerId: absentee.learner_id, collectorName: 'Random Stranger' })
    expect(res.status).toBe(409)
  })

  it('needs a learner and a name (or an explicit null)', async () => {
    expect((await raise({ learnerId: learner.learner_id })).status).toBe(400)
    expect((await raise({ learnerId: learner.learner_id, collectorName: '   ' })).status).toBe(400)
    expect((await raise({ collectorName: 'Random Stranger' })).status).toBe(400)
  })

  it('returns 404 for a learner that does not exist', async () => {
    expect((await raise({ learnerId: 999999, collectorName: 'Random Stranger' })).status).toBe(404)
  })
})

describe('GET /api/signout/escalations', () => {
  it('starts empty: the queue only holds what staff really sent', async () => {
    const res = await list()
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ open: [], resolved: [] })
  })

  it('splits open requests from decided ones', async () => {
    const { body: entry } = await raise(STRANGER())
    expect((await list()).body.open.map((e) => e.escalationId)).toEqual([entry.escalationId])

    await decide(entry.escalationId, 'dismiss')
    const { body } = await list()
    expect(body.open).toEqual([])
    expect(body.resolved[0]).toMatchObject({ status: 'dismissed', resolvedBy: 'Sarah Botha' })
  })

  it('drops an open request once the learner has been signed out another way', async () => {
    await raise(STRANGER())
    await request(app).post('/api/signout/confirm').set('Cookie', teacher.cookie)
      .send({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    expect((await list()).body.open).toEqual([])
  })

  it("leaves out earlier days' requests", async () => {
    const { body: entry } = await raise(STRANGER())
    await pool.query(`UPDATE signout_escalations SET "record_date" = "record_date" - 1 WHERE "escalation_id" = $1`, [entry.escalationId])
    expect((await list()).body.open).toEqual([])
  })
})

describe('PATCH /api/signout/escalations/:escalationId', () => {
  it('approving signs the learner out with the named collector and the manager as recorder', async () => {
    const { body: entry } = await raise(STRANGER())
    const res = await decide(entry.escalationId, 'approve')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'approved', signOut: { timeOut: expect.stringMatching(/^\d{2}:\d{2}$/) } })

    const { rows } = await pool.query('SELECT "guardian_id", "collector_name", "teacher_id", "manager_id" FROM sign_out_records')
    expect(rows).toEqual([{
      guardian_id: null, collector_name: 'Random Stranger', teacher_id: null, manager_id: manager.profile.manager_id,
    }])

    const signedOut = (await today()).body.learners.find((l) => l.learnerId === learner.learner_id).signedOut
    expect(signedOut).toMatchObject({ collectedBy: 'Random Stranger', recordedBy: 'Sarah Botha' })
  })

  it('shows the approved collector to the parent too', async () => {
    const { body: entry } = await raise(STRANGER())
    await decide(entry.escalationId, 'approve')
    const { body } = await request(app).get(`/api/guardian/children/${learner.learner_id}/overview`).set('Cookie', guardian.cookie)
    expect(body.today.signedOut.collectedBy).toBe('Random Stranger')
  })

  it('approving a walk-home request records walking home alone', async () => {
    const { body: entry } = await raise({ learnerId: learner.learner_id, collectorName: null })
    await decide(entry.escalationId, 'approve')
    const signedOut = (await today()).body.learners.find((l) => l.learnerId === learner.learner_id).signedOut
    expect(signedOut.collectedBy).toBe('Walked home alone')
  })

  it('dismissing leaves the learner at the centre, and they can be queued again', async () => {
    const { body: entry } = await raise(STRANGER())
    const res = await decide(entry.escalationId, 'dismiss')
    expect(res.body).toMatchObject({ status: 'dismissed', signOut: null })
    expect(await signOutCount()).toBe(0)
    expect((await raise(STRANGER())).status).toBe(201)
  })

  it('can only be decided once', async () => {
    const { body: entry } = await raise(STRANGER())
    await decide(entry.escalationId, 'dismiss')
    const res = await decide(entry.escalationId, 'approve')
    expect(res.status).toBe(409)
    expect(await signOutCount()).toBe(0)
  })

  it('stays open if the learner has already gone, and writes no second sign-out', async () => {
    const { body: entry } = await raise(STRANGER())
    await request(app).post('/api/signout/confirm').set('Cookie', teacher.cookie)
      .send({ learnerId: learner.learner_id, guardianId: guardian.profile.guardian_id })
    const res = await decide(entry.escalationId, 'approve')
    expect(res.status).toBe(409)
    expect(await signOutCount()).toBe(1)
    const { rows } = await pool.query('SELECT "status" FROM signout_escalations')
    expect(rows[0].status).toBe('open') // The failed approval rolled back.
  })

  it("won't approve a request from an earlier day", async () => {
    const { body: entry } = await raise(STRANGER())
    await pool.query(`UPDATE signout_escalations SET "record_date" = "record_date" - 1 WHERE "escalation_id" = $1`, [entry.escalationId])
    expect((await decide(entry.escalationId, 'approve')).status).toBe(409)
    expect(await signOutCount()).toBe(0)
  })

  it('rejects an unknown action, and an unknown request', async () => {
    const { body: entry } = await raise(STRANGER())
    expect((await decide(entry.escalationId, 'maybe')).status).toBe(400)
    expect((await decide(999999, 'approve')).status).toBe(404)
  })

  it('a teacher cannot approve their own request', async () => {
    const { body: entry } = await raise(STRANGER())
    expect((await decide(entry.escalationId, 'approve', teacher)).status).toBe(403)
    expect(await signOutCount()).toBe(0)
  })
})

describe('the request on GET /api/signout/today', () => {
  const row = async (user = teacher) =>
    (await today(user)).body.learners.find((l) => l.learnerId === learner.learner_id).escalation

  it('is null when nothing has been sent to the queue', async () => {
    expect(await row()).toBeNull()
  })

  it('tells staff the learner is waiting for a manager', async () => {
    await raise(STRANGER())
    expect(await row()).toEqual({ status: 'open', collectorName: 'Random Stranger', resolvedBy: null, resolvedAt: null })
  })

  it('tells staff when a manager dismissed it, and who did', async () => {
    const { body: entry } = await raise(STRANGER())
    await decide(entry.escalationId, 'dismiss')
    expect(await row()).toEqual({
      status: 'dismissed', collectorName: 'Random Stranger', resolvedBy: 'Sarah Botha', resolvedAt: expect.stringMatching(/^\d{2}:\d{2}$/),
    })
  })

  it('shows the newest request after a dismissed one', async () => {
    const { body: entry } = await raise(STRANGER())
    await decide(entry.escalationId, 'dismiss')
    await raise({ learnerId: learner.learner_id, collectorName: 'Someone Else' })
    expect(await row()).toMatchObject({ status: 'open', collectorName: 'Someone Else' })
  })

  it('goes away once the learner has been signed out', async () => {
    const { body: entry } = await raise(STRANGER())
    await decide(entry.escalationId, 'approve')
    expect(await row()).toBeNull()
  })
})

describe('GET /api/guardian/me', () => {
  it("returns the parent's own details and children", async () => {
    const res = await request(app).get('/api/guardian/me').set('Cookie', guardian.cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      fullName: 'Fatima Petersen',
      contactNumber: '0820000000',
      children: [{ learnerId: learner.learner_id, name: 'Aisha Petersen' }],
    })
  })

  it("doesn't show one parent another parent's children", async () => {
    const other = await createUser('guardian', { fullName: 'Grace Ntombela' })
    const res = await request(app).get('/api/guardian/me').set('Cookie', other.cookie)
    expect(res.body).toMatchObject({ fullName: 'Grace Ntombela', children: [] })
  })
})
