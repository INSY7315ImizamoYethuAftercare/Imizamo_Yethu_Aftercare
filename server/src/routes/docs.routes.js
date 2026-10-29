/**
 * API documentation: /api/docs (Swagger UI page) and /api/openapi.json (the
 * raw OpenAPI spec, for other clients and tools). Both are public: they
 * describe the API but give no access to data.
 *
 * The spec lives in src/docs so the deploy script (which copies only
 * server/src) ships it to Azure.
 */
import { readFileSync } from 'node:fs'
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'

export const openApiSpec = YAML.parse(readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'))

export const docsRouter = Router()

docsRouter.get('/openapi.json', (req, res) => res.json(openApiSpec))

docsRouter.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'Imizamo Yethu Aftercare API',
    // Sends the session cookie with "Try it out" requests.
    // validatorUrl: null stops the page loading a badge from validator.swagger.io,
    // which helmet's Content-Security-Policy would block anyway.
    swaggerOptions: { withCredentials: true, persistAuthorization: true, validatorUrl: null },
  }),
)
