/**
 * Request validation middleware.
 *
 *   router.post('/', authorize('manager'), validate(createLearner), handler)
 *
 * `schemas` is { params?, body?, query? }, each a Zod schema. The parsed
 * result goes on req.validated ({ params, body, query }) and controllers read
 * only from there, never from req.body, req.params or req.query. Anything
 * that fails is a 400 with the first problem as { message }, so bad input
 * never reaches the services or Postgres.
 *
 * Put validate() AFTER authenticate and authorize, so a caller who is not
 * allowed in gets 401 or 403 and learns nothing about the request shape.
 *
 * Nothing is written back to req.query: Express 5 makes it read-only.
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    // A request with no JSON body has req.body undefined; treat it as {}.
    const input = { params: req.params, body: req.body ?? {}, query: req.query }
    const validated = {}

    for (const part of ['params', 'body', 'query']) {
      const schema = schemas[part]
      if (!schema) continue

      const result = schema.safeParse(input[part])
      if (!result.success) {
        const err = new Error(result.error.issues[0]?.message ?? 'Invalid request')
        err.status = 400
        return next(err)
      }
      validated[part] = result.data
    }

    req.validated = validated
    next()
  }
}
