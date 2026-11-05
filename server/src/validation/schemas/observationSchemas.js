// Validation for /api/observations.
import { LIMITS, body, idField, idParams, ratingField, textField, toColumns } from '../fields.js'

export const addObservation = {
  body: body({
    learnerId: idField('learnerId'),
    category: textField('category', { max: LIMITS.category }),
    rating: ratingField(),
    notes: textField('notes', { max: LIMITS.notes, required: false }),
  }),
}

export const learnerParams = { params: idParams('learnerId') }

export const observationParams = { params: idParams('observationId') }

export const updateObservation = {
  params: idParams('observationId'),
  body: body({
    category: textField('category', { max: LIMITS.category }).optional(),
    rating: ratingField().optional(),
    // null clears the notes.
    notes: textField('notes', { max: LIMITS.notes, required: false }),
  }).transform((values) =>
    toColumns(values, { category: 'category', rating: 'rating', notes: 'notes' }),
  ),
}
