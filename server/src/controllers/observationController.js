import { ObservationService } from '../services/ObservationService.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import { pool } from '../db/pool.js'

const observationService = new ObservationService({
  observationRepository: new ObservationRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  teacherRepository: new TeacherRepository(pool),
})

export async function addObservation(req, res, next) {
  try {
   const { learnerId, category, rating, notes } = req.body
    if (!learnerId || !category || rating === undefined) {
      const err = new Error('learnerId, category and rating are required')
      err.status = 400
      throw err
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      const err = new Error('rating must be a whole number from 1 to 10')
      err.status = 400
      throw err
    }
    const recordDate = new Date().toISOString().slice(0, 10)
    const observation = await observationService.addObservation({
      userId: req.user.userId, learnerId, category, rating, notes, recordDate,
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
      learnerId: Number(req.params.learnerId),
    })
    res.json(observations)
  } catch (err) {
    next(err)
  }
}

export async function updateObservation(req, res, next) {
  try {

    const { category, rating, notes } = req.body

    const fields = {}
    if (category !== undefined) fields.category = category
    if (rating !== undefined) fields.rating = rating
    if (notes !== undefined) fields.notes = note

    const updated = await observationService.updateObservation({
      userId: req.user.userId,
      observationId: Number(req.params.observationId),
      fields: { category, rating, notes },
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
      observationId: Number(req.params.observationId),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}