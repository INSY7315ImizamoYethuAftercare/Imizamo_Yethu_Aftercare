// The shared Zod field builders. Database-free.
import { describe, expect, it } from '@jest/globals'
import {
  body, colourField, dateField, emailField, flagField, idField, idParams, nullableDateField, nullableIdField,
  optionalFlagField, optionalIdField, passwordField, ratingField, signInTextField, textField, timeField, toColumns,
} from './fields.js'

// Returns the parsed value, or "ERR: <first message>" so each case reads on one line.
const run = (schema, input) => {
  const result = schema.safeParse(input)
  return result.success ? result.data : `ERR: ${result.error.issues[0].message}`
}
const shape = (fields, input) => run(body(fields), input)

describe('idField', () => {
  const id = idField('classId')

  it.each([[5, 5], ['12', 12], ['007', 7]])('accepts %p as %p', (input, expected) => {
    expect(run(id, input)).toBe(expected)
  })

  // (An array cannot be a bare it.each row, because Jest spreads it into arguments.)
  it.each([0, -3, 1.5, '1.5', 'abc', '', "1' OR '1'='1", '99999999999999999999', true, {}])(
    'refuses %p',
    (input) => {
      expect(run(id, input)).toMatch(/^ERR: classId (is required|must be a positive whole number)$/)
    },
  )

  it('refuses an array', () => {
    expect(run(id, [])).toBe('ERR: classId must be a positive whole number')
    expect(run(id, [5])).toBe('ERR: classId must be a positive whole number')
  })

  it('says "is required" for undefined, null and an empty string', () => {
    for (const input of [undefined, null, '']) expect(run(id, input)).toBe('ERR: classId is required')
  })

  it('says what is wrong for a bad value', () => {
    expect(run(id, 'abc')).toBe('ERR: classId must be a positive whole number')
  })
})

describe('optional and nullable ids', () => {
  it('optionalIdField turns undefined, null and "" into undefined and still checks a real value', () => {
    const fields = { classId: optionalIdField('classId') }
    for (const input of [{}, { classId: null }, { classId: '' }]) expect(shape(fields, input)).toEqual({})
    expect(shape(fields, { classId: '4' })).toEqual({ classId: 4 })
    expect(shape(fields, { classId: 'abc' })).toBe('ERR: classId must be a positive whole number')
  })

  it('nullableIdField keeps "not sent" apart from "clear it"', () => {
    const fields = { teacherId: nullableIdField('teacherId') }
    expect(shape(fields, {})).toEqual({})
    expect(shape(fields, { teacherId: null })).toEqual({ teacherId: null })
    expect(shape(fields, { teacherId: '' })).toEqual({ teacherId: null })
    expect(shape(fields, { teacherId: '7' })).toEqual({ teacherId: 7 })
    expect(shape(fields, { teacherId: 'abc' })).toBe('ERR: teacherId must be a positive whole number')
  })

  it('idParams accepts the null-prototype object Express gives for params and query', () => {
    const params = Object.assign(Object.create(null), { classId: '5' })
    expect(run(idParams('classId'), params)).toEqual({ classId: 5 })
  })
})

describe('textField', () => {
  const status = textField('status', { max: 10 })

  it('keeps required text exactly as sent', () => {
    expect(run(status, ' present ')).toBe(' present ')
  })

  it.each([
    [undefined, 'status is required'],
    [null, 'status is required'],
    ['', 'status is required'],
    ['   ', 'status is required'],
    [['present'], 'status must be text'],
    [5, 'status must be text'],
    ['x'.repeat(11), 'status must be at most 10 characters'],
  ])('refuses %p', (input, message) => {
    expect(run(status, input)).toBe(`ERR: ${message}`)
  })

  it('lets optional text be left out or null, but still checks what is given', () => {
    const notes = textField('notes', { max: 5, required: false })
    expect(run(notes, undefined)).toBeUndefined()
    expect(run(notes, null)).toBeNull()
    expect(run(notes, '')).toBe('')
    expect(run(notes, 'x'.repeat(6))).toBe('ERR: notes must be at most 5 characters')
    expect(run(notes, 7)).toBe('ERR: notes must be text')
  })
})

describe('emailField', () => {
  it('trims and lower-cases', () => {
    expect(run(emailField(), '  Thabo@Example.CO.za ')).toBe('thabo@example.co.za')
  })

  it.each([
    ['not-an-email', 'email must be a valid email address'],
    ['a@b', 'email must be a valid email address'],
    ['a b@c.d', 'email must be a valid email address'],
    ['', 'email is required'],
    [undefined, 'email is required'],
    [42, 'email must be text'],
    [`${'a'.repeat(251)}@b.co`, 'email must be at most 255 characters'],
  ])('refuses %p', (input, message) => {
    expect(run(emailField(), input)).toBe(`ERR: ${message}`)
  })

  it('uses the field name given', () => {
    expect(run(emailField('contactEmail'), 'nope')).toBe('ERR: contactEmail must be a valid email address')
  })
})

describe('passwordField', () => {
  it('accepts 8 to 72 characters and does not change them', () => {
    expect(run(passwordField(), ' pass word ')).toBe(' pass word ')
    expect(run(passwordField(), 'x'.repeat(72))).toBe('x'.repeat(72))
  })

  it.each([
    ['short', 'password must be at least 8 characters'],
    ['x'.repeat(73), 'password must be at most 72 characters'],
    [undefined, 'password is required'],
    [null, 'password is required'],
    [['Long-enough-1'], 'password must be text'],
  ])('refuses %p', (input, message) => {
    expect(run(passwordField(), input)).toBe(`ERR: ${message}`)
  })

  it('uses the field name given', () => {
    expect(run(passwordField('newPassword'), 'short')).toBe('ERR: newPassword must be at least 8 characters')
  })
})

describe('signInTextField', () => {
  it('checks only the type, so old short passwords can still sign in', () => {
    expect(run(signInTextField('password'), 'abc')).toBe('abc')
    expect(run(signInTextField('password'), '')).toBe('ERR: password is required')
    expect(run(signInTextField('password'), undefined)).toBe('ERR: password is required')
    expect(run(signInTextField('password'), 12345)).toBe('ERR: password must be text')
  })
})

describe('dates', () => {
  const dob = dateField('dateOfBirth')

  it.each(['2026-01-31', '2024-02-29', '2000-12-01'])('accepts %p', (input) => {
    expect(run(dob, input)).toBe(input)
  })

  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '14/03/2018', '2026-1-1', 'soon', "2026-01-01' OR '1'='1"])(
    'refuses %p',
    (input) => {
      expect(run(dob, input)).toBe('ERR: dateOfBirth must be a date in YYYY-MM-DD format')
    },
  )

  it('is required unless an optional version is used', () => {
    expect(run(dob, undefined)).toBe('ERR: dateOfBirth is required')
    expect(run(dob, '')).toBe('ERR: dateOfBirth is required')
    expect(run(dob, ['2026-01-01'])).toBe('ERR: dateOfBirth must be a date in YYYY-MM-DD format')
  })

  it('nullableDateField keeps "not sent" apart from "clear it"', () => {
    const fields = { dateOfBirth: nullableDateField('dateOfBirth') }
    expect(shape(fields, {})).toEqual({})
    expect(shape(fields, { dateOfBirth: null })).toEqual({ dateOfBirth: null })
    expect(shape(fields, { dateOfBirth: '' })).toEqual({ dateOfBirth: null })
    expect(shape(fields, { dateOfBirth: '2018-03-14' })).toEqual({ dateOfBirth: '2018-03-14' })
    expect(shape(fields, { dateOfBirth: '2018-02-30' })).toBe('ERR: dateOfBirth must be a date in YYYY-MM-DD format')
  })
})

describe('timeField', () => {
  const fields = { timeIn: timeField('timeIn') }

  it('is optional and accepts HH:MM and HH:MM:SS', () => {
    expect(shape(fields, {})).toEqual({})
    expect(shape(fields, { timeIn: '' })).toEqual({})
    expect(shape(fields, { timeIn: '07:45' })).toEqual({ timeIn: '07:45' })
    expect(shape(fields, { timeIn: '23:59:59' })).toEqual({ timeIn: '23:59:59' })
  })

  it.each(['noon', '25:00', '14:60:00', '7:45', 745])('refuses %p', (timeIn) => {
    expect(shape(fields, { timeIn })).toBe('ERR: timeIn must be a time in HH:MM or HH:MM:SS format')
  })

  it('refuses an array', () => {
    expect(shape(fields, { timeIn: ['07:45'] })).toBe('ERR: timeIn must be a time in HH:MM or HH:MM:SS format')
  })
})

describe('colourField', () => {
  const fields = { colour: colourField() }

  it('upper-cases a hex colour, and keeps "not sent" apart from "no colour"', () => {
    expect(shape(fields, {})).toEqual({})
    expect(shape(fields, { colour: '#ffd166' })).toEqual({ colour: '#FFD166' })
    expect(shape(fields, { colour: null })).toEqual({ colour: null })
    expect(shape(fields, { colour: '' })).toEqual({ colour: null })
  })

  it.each(['purple', '#FFF', '#GGGGGG', 123, '#FFD166; DROP TABLE x'])('refuses %p', (colour) => {
    expect(shape(fields, { colour })).toBe('ERR: colour must be a hex colour such as #FFD166')
  })
})

describe('ratingField', () => {
  it.each([1, 5, 10])('accepts %p', (rating) => expect(run(ratingField(), rating)).toBe(rating))

  it.each([0, 11, -1, 5.5, '7', null, true, NaN])('refuses %p', (rating) => {
    expect(run(ratingField(), rating)).toMatch(/^ERR: rating (is required|must be a whole number from 1 to 10)$/)
  })

  it('says "is required" when missing', () => {
    expect(run(ratingField(), undefined)).toBe('ERR: rating is required')
  })
})

describe('flags', () => {
  it('only a real true or the string "true" counts as true', () => {
    for (const [input, expected] of [[true, true], ['true', true], [false, false], ['false', false], ['yes', false], [1, false], [null, false]]) {
      expect(shape({ flag: flagField() }, { flag: input })).toEqual({ flag: expected })
    }
  })

  it('flagField defaults to false when left out', () => {
    expect(shape({ flag: flagField() }, {})).toEqual({ flag: false })
  })

  it('optionalFlagField leaves "not sent" out, so an update does not change it by accident', () => {
    expect(shape({ flag: optionalFlagField() }, {})).toEqual({})
    expect(shape({ flag: optionalFlagField() }, { flag: 'false' })).toEqual({ flag: false })
    expect(shape({ flag: optionalFlagField() }, { flag: 'true' })).toEqual({ flag: true })
  })
})

describe('body and toColumns', () => {
  it('body refuses anything that is not a JSON object', () => {
    expect(run(body({}), [])).toBe('ERR: The request body must be a JSON object')
    expect(run(body({}), 'text')).toBe('ERR: The request body must be a JSON object')
  })

  it('body drops fields it does not know about', () => {
    expect(shape({ name: textField('name') }, { name: 'A', isAdmin: true })).toEqual({ name: 'A' })
  })

  it('toColumns renames only the keys that were sent, and keeps null', () => {
    const columns = { firstName: 'first_name', dateOfBirth: 'date_of_birth', isActive: 'is_active' }
    expect(toColumns({ firstName: 'A', dateOfBirth: null }, columns)).toEqual({ first_name: 'A', date_of_birth: null })
    expect(toColumns({}, columns)).toEqual({})
    expect(toColumns({ isActive: false }, columns)).toEqual({ is_active: false })
  })
})
