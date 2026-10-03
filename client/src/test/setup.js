import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { afterEach, expect, vi } from 'vitest'

expect.extend(toHaveNoViolations)

// No real network calls from any test: anything that slips past the
// apiClient mock fails loudly instead of hitting a server.
globalThis.fetch = vi.fn(() => Promise.reject(new Error('Real network call attempted in a test')))

// jsdom doesn't implement these; pages call them.
window.alert = vi.fn()
window.scrollTo = vi.fn()

afterEach(() => {
  cleanup()
})
