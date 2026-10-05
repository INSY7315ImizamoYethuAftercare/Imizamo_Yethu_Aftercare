import { useSyncExternalStore } from 'react'
import { apiClient, setUnauthorizedHandler } from './apiClient'

// Who is logged in. The real session is the httpOnly "token" cookie set by
// POST /api/auth/login (JavaScript can't read it); this store only holds the
// profile the API returned so screens can show a name and pick a home page.
//
// status: "unknown" (haven't asked the server yet) | "authed" | "anon"
let state = { user: null, status: 'unknown' }
const listeners = new Set()
const resetters = new Set()

const emit = () => listeners.forEach((fn) => fn())
const set = (next) => {
  state = next
  emit()
}
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Data stores register here so they empty themselves on login/logout. */
export const onSessionReset = (fn) => {
  resetters.add(fn)
  return () => resetters.delete(fn)
}

// A master admin can do everything a manager can, so uses the manager's
// pages: their "app role" is manager. user.role stays the real account role
// (admin) and user.accessLevel says 'master' or 'standard'.
export const appRoleOf = (user) =>
  user?.role === 'admin' && user?.accessLevel === 'master' ? 'manager' : user?.role ?? null

export const isMasterAdmin = (user) => user?.role === 'admin' && user?.accessLevel === 'master'

const withAppRole = (user) => (user ? { ...user, appRole: appRoleOf(user) } : null)

/** The role the app treats the user as (see appRoleOf). */
export const getSessionRole = () => state.user?.appRole ?? null

/** Where each role lands after signing in. */
export const homePathFor = (role) =>
  ({ manager: '/manager', teacher: '/home', admin: '/admin', guardian: '/parent' })[role] ?? '/'

/** Asks the server whether the cookie is still good (once per page load). */
export async function restoreSession() {
  if (state.status !== 'unknown') return state
  try {
    const { user } = await apiClient.get('/auth/me')
    set({ user: withAppRole(user), status: 'authed' })
  } catch {
    set({ user: null, status: 'anon' })
  }
  return state
}

export async function login(email, password) {
  const { user } = await apiClient.post('/auth/login', { email, password })
  resetters.forEach((fn) => fn())
  set({ user: withAppRole(user), status: 'authed' })
  return state.user
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Even if the request fails, drop the local session.
  }
  resetters.forEach((fn) => fn())
  set({ user: null, status: 'anon' })
}

// Any API call that comes back 401 (cookie expired after 8h, account
// suspended) drops the local session; <Protected> then redirects to login.
setUnauthorizedHandler(() => {
  if (state.status === 'authed') {
    resetters.forEach((fn) => fn())
    set({ user: null, status: 'anon' })
  }
})

export function useSession() {
  return useSyncExternalStore(subscribe, () => state)
}
