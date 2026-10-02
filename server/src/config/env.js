// Loads and validates environment variables in one place. Every other
// module should import `env` from here rather than touching
// `process.env` directly — that way a missing variable fails loudly at
// startup instead of causing a confusing bug three requests later.

import 'dotenv/config'

const required = ['PORT', 'CLIENT_ORIGIN', 'DATABASE_URL', 'JWT_SECRET']

// DATABASE_URL / JWT_SECRET are intentionally not "required" yet — they
// don't exist until the Database & Backend and Auth tasks are built.
// Uncomment as those land:
// required.push('DATABASE_URL', 'JWT_SECRET')

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.`,
  )
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN,
  databaseUrl: process.env.DATABASE_URL ?? null,
  // Azure PostgreSQL needs SSL. Set DB_SSL=true when pointing a dev machine at Azure.
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET ?? null,
}

export const isProduction = env.nodeEnv === 'production'
