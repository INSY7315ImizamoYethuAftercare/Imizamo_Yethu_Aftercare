// A fake apiClient. Tests register responses per "METHOD /path"; anything
// unregistered rejects with a 404 ApiError, so no test can reach a network.
//
// Usage in a test file (vi.mock is hoisted, so import the mock lazily):
//   vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)
import { vi } from 'vitest'

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

let routes = new Map()

/** Register a response: a value, a function (body) => value, or an Error to reject with. */
export function onApi(method, path, response) {
  routes.set(`${method.toUpperCase()} ${path}`, response)
}

export function resetApi() {
  routes = new Map()
  for (const fn of Object.values(apiClient)) fn.mockClear()
}

const handle = (method) =>
  vi.fn(async (path, body) => {
    // A route registered without a query string also answers requests with one.
    const exact = `${method} ${path}`
    const key = routes.has(exact) ? exact : exact.split('?')[0]
    if (!routes.has(key)) throw new ApiError(`No mock for ${exact}`, 404)
    const response = routes.get(key)
    const value = typeof response === 'function' ? await response(body) : response
    if (value instanceof Error) throw value
    return value
  })

export const apiClient = {
  get: handle('GET'),
  post: handle('POST'),
  patch: handle('PATCH'),
  delete: handle('DELETE'),
}

export const apiClientModule = { apiClient, ApiError, setUnauthorizedHandler: vi.fn() }
