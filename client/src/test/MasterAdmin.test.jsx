// The master admin: uses every manager page, and creates manager and
// standard admin accounts from the Staff page (GET/POST /accounts).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ManagerHome from '../pages/ManagerHome'
import Staff from '../pages/Staff'
import { appRoleOf } from '../services/session'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const ACCOUNTS = [
  { userId: 5, fullName: 'Nomvula Dube', email: 'master@iylh.org', type: 'master_admin', isActive: true },
  { userId: 3, fullName: 'Pieter Jacobs', email: 'admin@iylh.org', type: 'standard_admin', isActive: true },
  { userId: 1, fullName: 'Sarah Botha', email: 'sarah@iylh.org', type: 'manager', isActive: true },
]
const THABO = { userId: 9, fullName: 'Thabo Manager', email: 'thabo@iylh.org', type: 'manager', isActive: true }

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/teacher', [])
  onApi('GET', '/accounts', ACCOUNTS)
})

async function renderStaff(role = 'masterAdmin') {
  await signInAs(role)
  render(<MemoryRouter><Staff /></MemoryRouter>)
}

const accountsSection = () => screen.getByRole('region', { name: 'Managers & admins' })
const accountPosts = () => apiClient.post.mock.calls.filter(([path]) => path === '/accounts')

describe('app role', () => {
  it.each([
    [{ role: 'admin', accessLevel: 'master' }, 'manager'],
    [{ role: 'admin', accessLevel: 'standard' }, 'admin'],
    [{ role: 'manager' }, 'manager'],
    [{ role: 'teacher' }, 'teacher'],
  ])('%o uses the %s pages', (user, appRole) => {
    expect(appRoleOf(user)).toBe(appRole)
  })
})

describe('Master admin', () => {
  it('sees the manager dashboard, labelled Master Admin, with manager data loaded', async () => {
    await signInAs('masterAdmin')
    render(<MemoryRouter><ManagerHome /></MemoryRouter>)
    expect(await screen.findAllByText('Master Admin')).not.toHaveLength(0)
    // The class list is manager/teacher-only: it loads, so the Class Overview fills.
    expect(apiClient.get.mock.calls.map(([p]) => p)).toContain('/classes')
    expect(await screen.findByText('Yellow')).toBeInTheDocument()
  })

  it('lists managers and admins on the Staff page', async () => {
    await renderStaff()
    const section = await screen.findByRole('region', { name: 'Managers & admins' })
    expect(await within(section).findByText('Pieter Jacobs')).toBeInTheDocument()
    expect(within(section).getByText('Standard admin • admin@iylh.org')).toBeInTheDocument()
    expect(within(section).getByText('Manager • sarah@iylh.org')).toBeInTheDocument()
    expect(within(section).getByText('Master admin • master@iylh.org')).toBeInTheDocument()
  })

  it('creates a manager', async () => {
    onApi('POST', '/accounts', THABO)
    await renderStaff()
    await userEvent.click(await screen.findByRole('button', { name: '+ Add account' }))
    const section = accountsSection()
    expect(within(section).getByLabelText(/^Manager/)).toBeChecked()
    await userEvent.type(within(section).getByLabelText('FULL NAME'), 'Thabo Manager')
    await userEvent.type(within(section).getByLabelText('EMAIL (THEY SIGN IN WITH THIS)'), 'thabo@iylh.org')
    await userEvent.type(within(section).getByLabelText('STARTING PASSWORD'), 'Starting-pass-1')
    onApi('GET', '/accounts', [...ACCOUNTS, THABO])
    await userEvent.click(within(section).getByRole('button', { name: 'Add manager' }))

    expect(accountPosts()).toEqual([['/accounts', { type: 'manager', fullName: 'Thabo Manager', email: 'thabo@iylh.org', password: 'Starting-pass-1' }]])
    expect(await within(section).findByRole('status')).toHaveTextContent('Thabo Manager was added as a manager.')
    expect(within(section).getByText('Thabo Manager')).toBeInTheDocument()
  })

  it('creates a standard admin', async () => {
    onApi('POST', '/accounts', { ...THABO, fullName: 'Lerato Admin', type: 'standard_admin' })
    await renderStaff()
    await userEvent.click(await screen.findByRole('button', { name: '+ Add account' }))
    const section = accountsSection()
    await userEvent.click(within(section).getByLabelText(/^Standard admin/))
    await userEvent.type(within(section).getByLabelText('FULL NAME'), 'Lerato Admin')
    await userEvent.type(within(section).getByLabelText('EMAIL (THEY SIGN IN WITH THIS)'), 'lerato@iylh.org')
    await userEvent.type(within(section).getByLabelText('STARTING PASSWORD'), 'Starting-pass-1')
    await userEvent.click(within(section).getByRole('button', { name: 'Add standard admin' }))

    expect(accountPosts()[0][1]).toMatchObject({ type: 'standard_admin', fullName: 'Lerato Admin' })
    expect(await within(section).findByRole('status')).toHaveTextContent('Lerato Admin was added as a standard admin.')
  })

  it.each([
    [{ name: '' }, 'Please fill in every field.'],
    [{ email: 'nope' }, 'Please enter a valid email address.'],
    [{ password: 'short' }, 'The starting password must be at least 8 characters.'],
  ])('checks %o before sending', async (overrides, message) => {
    const v = { name: 'Thabo Manager', email: 'thabo@iylh.org', password: 'Starting-pass-1', ...overrides }
    await renderStaff()
    await userEvent.click(await screen.findByRole('button', { name: '+ Add account' }))
    const section = accountsSection()
    if (v.name) await userEvent.type(within(section).getByLabelText('FULL NAME'), v.name)
    if (v.email) await userEvent.type(within(section).getByLabelText('EMAIL (THEY SIGN IN WITH THIS)'), v.email)
    if (v.password) await userEvent.type(within(section).getByLabelText('STARTING PASSWORD'), v.password)
    await userEvent.click(within(section).getByRole('button', { name: 'Add manager' }))
    expect(within(section).getByRole('alert')).toHaveTextContent(message)
    expect(accountPosts()).toHaveLength(0)
  })

  it('shows the server message (e.g. email already used) and keeps the form', async () => {
    onApi('POST', '/accounts', new ApiError('An account with this email already exists', 409))
    await renderStaff()
    await userEvent.click(await screen.findByRole('button', { name: '+ Add account' }))
    const section = accountsSection()
    await userEvent.type(within(section).getByLabelText('FULL NAME'), 'Sarah Two')
    await userEvent.type(within(section).getByLabelText('EMAIL (THEY SIGN IN WITH THIS)'), 'sarah@iylh.org')
    await userEvent.type(within(section).getByLabelText('STARTING PASSWORD'), 'Starting-pass-1')
    await userEvent.click(within(section).getByRole('button', { name: 'Add manager' }))
    expect(await within(section).findByRole('alert')).toHaveTextContent('An account with this email already exists')
    expect(within(section).getByLabelText('FULL NAME')).toHaveValue('Sarah Two')
  })

  it('the accounts section has no accessibility violations', async () => {
    await renderStaff()
    await userEvent.click(await screen.findByRole('button', { name: '+ Add account' }))
    expect(await axe(accountsSection())).toHaveNoViolations()
  })
})

describe('A normal manager', () => {
  it('does not see the accounts section, and never asks for /accounts', async () => {
    await renderStaff('manager')
    await screen.findByText('Staff oversight')
    expect(screen.queryByRole('region', { name: 'Managers & admins' })).not.toBeInTheDocument()
    expect(apiClient.get.mock.calls.map(([p]) => p)).not.toContain('/accounts')
  })
})
