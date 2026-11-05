// The validate() middleware, with a fake req and next. Database-free.
import { describe, expect, it, jest } from '@jest/globals'
import { z } from 'zod'
import { validate } from './validate.js'

const schemas = {
  params: z.object({ id: z.preprocess(
    (v) => Number(v),
    z.number({ error: 'id must be a positive whole number' }).int().positive({ error: 'id must be a positive whole number' }),
  ) }),
  body: z.object({ name: z.string({ error: 'name is required' }).min(1, 'name is required') }),
  query: z.object({ flag: z.preprocess((v) => v === 'true', z.boolean()) }),
}

const run = (req, schemasToUse = schemas) => {
  const next = jest.fn()
  validate(schemasToUse)(req, {}, next)
  return { req, next, error: next.mock.calls[0][0] }
}

describe('validate()', () => {
  it('puts the parsed params, body and query on req.validated and calls next() with no error', () => {
    const { req, next, error } = run({ params: { id: '5' }, body: { name: 'A', extra: 1 }, query: { flag: 'true' } })
    expect(next).toHaveBeenCalledTimes(1)
    expect(error).toBeUndefined()
    expect(req.validated).toEqual({ params: { id: 5 }, body: { name: 'A' }, query: { flag: true } })
  })

  it('does not write back to req.body, req.params or req.query (Express 5 makes query read-only)', () => {
    const query = Object.freeze({ flag: 'true' })
    const { req, error } = run({ params: { id: '5' }, body: { name: 'A' }, query })
    expect(error).toBeUndefined()
    expect(req.query).toBe(query)
    expect(req.params).toEqual({ id: '5' })
    expect(req.body).toEqual({ name: 'A' })
  })

  it('answers a failure with a 400 that carries the first message', () => {
    const { error, req } = run({ params: { id: 'abc' }, body: { name: 'A' }, query: {} })
    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(400)
    expect(error.message).toBe('id must be a positive whole number')
    expect(req.validated).toBeUndefined()
  })

  it('treats a missing body (req.body undefined) as {}', () => {
    const { error } = run({ params: { id: '1' }, query: {} })
    expect(error.status).toBe(400)
    expect(error.message).toBe('name is required')
  })

  it('only checks the parts it was given schemas for', () => {
    const { req, error } = run({ params: { whatever: 'x' }, body: undefined, query: undefined }, { params: z.object({}) })
    expect(error).toBeUndefined()
    expect(req.validated).toEqual({ params: {} })
  })

  it('works with no schemas at all', () => {
    const req = { params: {}, body: {}, query: {} }
    const next = jest.fn()
    validate()(req, {}, next)
    expect(next.mock.calls[0][0]).toBeUndefined()
    expect(req.validated).toEqual({})
  })
})
