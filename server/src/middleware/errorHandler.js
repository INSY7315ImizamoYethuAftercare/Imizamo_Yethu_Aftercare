import { isProduction } from '../config/env.js'

// 404s that fall through every route.
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Centralized error handler — every route/controller can just
// `next(err)` instead of hand-rolling try/catch responses everywhere.
// Keep this LAST in the middleware chain (Express identifies it by arity).
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err)
  }

  res.status(status).json({
    message: status >= 500 && isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  })
}
