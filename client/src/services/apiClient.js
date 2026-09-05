// Central place for all HTTP calls to the backend.
// Keeping this in one file means auth headers, error handling, and the
// base URL only need to change in one place as later tasks add real
// endpoints (auth, attendance, sign-out, reports, etc.)

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include', // sends the httpOnly JWT cookie once auth exists
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(data?.message ?? response.statusText, response.status, data)
  }

  return data
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export { ApiError }
