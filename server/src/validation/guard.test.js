// Guards that keep validation from being skipped by accident. They read the
// source files, so they need no database and no running server.
//
//  1. A controller must never read req.body, req.params or req.query itself.
//     It reads req.validated, which only exists after validate() has passed.
//  2. A route that takes a body or a :param must run validate() before its handler.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from '@jest/globals'

const read = (dir) =>
  readdirSync(new URL(dir, import.meta.url))
    .filter((name) => name.endsWith('.js') && !name.endsWith('.test.js'))
    .map((name) => ({ name, source: readFileSync(new URL(`${dir}${name}`, import.meta.url), 'utf8') }))

// Drops comments, so a note such as "never read req.body" does not trip the guard.
const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('controllers', () => {
  const controllers = read('../controllers/')

  it('finds the controllers', () => {
    expect(controllers.length).toBeGreaterThanOrEqual(10)
  })

  it.each(controllers.map(({ name, source }) => [name, source]))('%s never reads req.body, req.params or req.query', (_name, source) => {
    const offences = withoutComments(source).match(/\breq\.(body|params|query)\b/g) ?? []
    expect(offences).toEqual([])
  })
})

describe('routes', () => {
  // Routes that need no validation: nothing to read from the request.
  const EXEMPT = new Set(['auth.routes.js: POST /logout'])

  const routeCalls = (source) =>
    [...withoutComments(source).matchAll(/\b\w+Router\.(get|post|patch|put|delete)\(\s*'([^']*)'([\s\S]*?)\)\s*$/gm)].map(
      ([, method, path, rest]) => ({ method: method.toUpperCase(), path, rest }),
    )

  const routes = read('../routes/').flatMap(({ name, source }) => routeCalls(source).map((route) => ({ file: name, ...route })))

  it('finds the routes', () => {
    expect(routes.length).toBeGreaterThanOrEqual(40)
  })

  it('every route with a :param or a body runs validate() before its handler', () => {
    const missing = routes
      .filter(({ method, path }) => path.includes(':') || ['POST', 'PATCH', 'PUT'].includes(method))
      .filter(({ file, method, path }) => !EXEMPT.has(`${file}: ${method} ${path}`))
      .filter(({ rest }) => !rest.includes('validate('))
      .map(({ file, method, path }) => `${file}: ${method} ${path}`)
    expect(missing).toEqual([])
  })

  it('runs validate() after authentication and authorisation, never before', () => {
    const wrongOrder = routes
      .filter(({ rest }) => rest.includes('validate(') && /authorize\(/.test(rest))
      .filter(({ rest }) => rest.indexOf('validate(') < rest.indexOf('authorize('))
      .map(({ file, method, path }) => `${file}: ${method} ${path}`)
    expect(wrongOrder).toEqual([])
  })

  it('the old hand-written validator is gone', () => {
    expect(() => readFileSync(new URL('../utils/validation.js', import.meta.url))).toThrow()
  })
})
