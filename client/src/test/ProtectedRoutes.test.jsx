// <Protected> in App.jsx: anonymous users go to sign-in, and each role is
// bounced to its own home when it opens another role's page. Pages are
// stubbed so this tests routing only.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { resetApi } from './api-mock'
import { signInAs, signOutCompletely } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const { stub } = vi.hoisted(() => ({ stub: (label) => ({ default: () => `page:${label}` }) }))
vi.mock('../pages/Login', () => stub('login'))
vi.mock('../pages/Register', () => stub('register'))
vi.mock('../pages/Home', () => stub('teacher-home'))
vi.mock('../pages/ManagerHome', () => stub('manager-home'))
vi.mock('../pages/AdminHome', () => stub('admin-home'))
vi.mock('../pages/ParentHome', () => stub('parent-home'))
vi.mock('../pages/ParentSettings', () => stub('parent-settings'))
vi.mock('../pages/Attendance', () => stub('attendance'))
vi.mock('../pages/Learners', () => stub('learners'))
vi.mock('../pages/Classes', () => stub('classes'))
vi.mock('../pages/SignOut', () => stub('signout'))
vi.mock('../pages/Observations', () => stub('observations'))
vi.mock('../pages/Reports', () => stub('reports'))
vi.mock('../pages/Settings', () => stub('settings'))
vi.mock('../pages/Escalations', () => stub('escalations'))
vi.mock('../pages/Staff', () => stub('staff'))

const visit = (path) => {
  window.history.pushState({}, '', path)
  render(<App />)
}

beforeEach(() => resetApi())

describe('anonymous visitors', () => {
  it.each(['/home', '/attendance', '/manager', '/manager/learners', '/admin', '/admin/reports', '/parent'])(
    '%s redirects to sign-in',
    async (path) => {
      await signOutCompletely()
      visit(path)
      expect(await screen.findByText('page:login')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/')
    },
  )

  it('can open the register page', async () => {
    await signOutCompletely()
    visit('/register')
    expect(await screen.findByText('page:register')).toBeInTheDocument()
  })
})

// [role, a page they own, pages they must be bounced from, their home]
const CASES = [
  ['teacher', ['/attendance', 'attendance'], ['/manager', '/admin', '/parent', '/manager/learners'], ['/home', 'teacher-home']],
  ['manager', ['/manager/learners', 'learners'], ['/home', '/admin', '/parent', '/attendance'], ['/manager', 'manager-home']],
  ['admin', ['/admin/reports', 'reports'], ['/home', '/manager', '/parent', '/signout'], ['/admin', 'admin-home']],
  ['guardian', ['/parent', 'parent-home'], ['/home', '/attendance', '/manager', '/admin/learners'], ['/parent', 'parent-home']],
]

describe.each(CASES)('%s', (role, [ownPath, ownPage], forbidden, [homePath, homePage]) => {
  it(`can open ${ownPath}`, async () => {
    await signInAs(role)
    visit(ownPath)
    expect(await screen.findByText(`page:${ownPage}`)).toBeInTheDocument()
  })

  it.each(forbidden)(`is redirected from %s to ${homePath}`, async (path) => {
    await signInAs(role)
    visit(path)
    expect(await screen.findByText(`page:${homePage}`)).toBeInTheDocument()
    expect(window.location.pathname).toBe(homePath)
  })
})
