import { Router } from 'express'

export const healthRouter = Router()

// Unauthenticated, cheap endpoint for Azure App Service health checks
// and for confirming the deployed API is actually reachable (task #10).
healthRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
