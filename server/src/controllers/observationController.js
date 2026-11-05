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
    const { learnerId, category, rating, notes } = req.validated.body
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
      learnerId: req.validated.params.learnerId,
    })
    res.json(observations)
  } catch (err) {
    next(err)
  }
}

export async function updateObservation(req, res, next) {
  try {
    // The schema keeps only the sent fields; a null notes clears the notes.
    const updated = await observationService.updateObservation({
      userId: req.user.userId,
      observationId: req.validated.params.observationId,
      fields: req.validated.body,
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
      observationId: req.validated.params.observationId,
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}