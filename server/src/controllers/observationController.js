import { ObservationService } from '../services/ObservationService.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import { pool } from '../db/pool.js'
import * as validate from '../utils/validation.js'

const observationService = new ObservationService({
  observationRepository: new ObservationRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  teacherRepository: new TeacherRepository(pool),
})

export async function addObservation(req, res, next) {
  try {
   const { learnerId, category, rating, notes } = req.body ?? {}
    if (!learnerId || !category || rating === undefined) {
      const err = new Error('learnerId, category and rating are required')
      err.status = 400
      throw err
    }
    validate.rating(rating)
    validate.text(category, 'category', { max: validate.LIMITS.category })
    validate.text(notes, 'notes', { max: validate.LIMITS.notes, required: false })
    const recordDate = new Date().toISOString().slice(0, 10)
    const observation = await observationService.addObservation({
      userId: req.user.userId, learnerId: validate.parseId(learnerId, 'learnerId'), category, rating, notes, recordDate,
    })
    res.status(201).json(observation)
  } catch (err) {
    next(err)
  }
}

export async function getLearnerObservations(req, res, next) {
  try {
    const observations = await observationService.getLearnerObservations({
      userId: req.user.userId,
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
    })
    res.json(observations)
  } catch (err) {
    next(err)
  }
}

export async function updateObservation(req, res, next) {
  try {

    const { category, rating, notes } = req.body ?? {}

    const fields = {}
    if (category !== undefined) fields.category = validate.text(category, 'category', { max: validate.LIMITS.category })
    if (rating !== undefined) fields.rating = validate.rating(rating)
    if (notes !== undefined) fields.notes = notes === null ? null : validate.text(notes, 'notes', { max: validate.LIMITS.notes, required: false })

    const updated = await observationService.updateObservation({
      userId: req.user.userId,
      observationId: validate.parseId(req.params.observationId, 'observationId'),
      fields,
    })
    res.json(updated)
  } 
  catch (err) {
    next(err)
  }
}

export async function deleteObservation(req, res, next) {
  try {
    await observationService.deleteObservation({
      userId: req.user.userId,
      observationId: validate.parseId(req.params.observationId, 'observationId'),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}