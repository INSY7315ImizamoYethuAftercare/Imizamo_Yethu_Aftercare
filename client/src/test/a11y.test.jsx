// jest-axe accessibility smoke test on the main pages (WCAG A/AA rules axe
// can check in jsdom; colour contrast needs real CSS so it is not covered).
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminHome from '../pages/AdminHome'
import Attendance from '../pages/Attendance'
import Home from '../pages/Home'
import Login from '../pages/Login'
import ManagerHome from '../pages/ManagerHome'
import ParentHome from '../pages/ParentHome'
import Register from '../pages/Register'
import SignOut from '../pages/SignOut'
import Staff from '../pages/Staff'
import { ApiError, onApi, resetApi } from './api-mock'
import { itKnownBug } from './knownBug'
import { AISHA_OVERVIEW } from './parent-fixtures'
import { CLASSES, LEARNERS, signInAs, signOutCompletely } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const PAGES = [
  ['Login', null, Login],
  ['Register', null, Register],
  ['Teacher home', 'teacher', Home],
  ['Attendance', 'teacher', Attendance],
  ['Sign-out', 'teacher', SignOut],
  ['Manager home', 'manager', ManagerHome],
  ['Admin home', 'admin', AdminHome],
  ['Parent home', 'guardian', ParentHome],
  ['Staff', 'manager', Staff],
]

beforeEach(() => {
  resetApi()
  onApi('GET', '/auth/me', new ApiError('Not authenticated', 401))
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/attendance/class/1', [])
  onApi('GET', '/attendance/class/2', [])
  onApi('GET', '/signout/today', { date: '2026-10-05', learners: [] })
  onApi('GET', '/teacher', [])
  onApi('GET', '/reports/overview', { totals: {}, today: { date: '2026-10-05', present: 3, activeLearners: 4, signedOut: 1, classes: [] } })
  onApi('GET', '/guardian/children', [{ learner_id: 3, first_name: 'Aisha', last_name: 'Petersen' }])
  onApi('GET', '/guardian/children/3/overview', AISHA_OVERVIEW)
})

async function axeViolations(role, Page) {
  if (role) await signInAs(role)
  else await signOutCompletely()
  const { container } = render(<MemoryRouter><Page /></MemoryRouter>)
  await screen.findAllByRole('button')
  const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } })
  return results
}

describe.each(PAGES)('%s', (_name, role, Page, knownBug) => {
  ;(knownBug ? itKnownBug : it)('has no detectable accessibility violations', async () => {
    expect(await axeViolations(role, Page)).toHaveNoViolations()
  })
})
