// "Change password" on the Settings pages. It used to only show
// "Password updated." without contacting the server, so nothing changed.
// It now posts to /auth/change-password, which checks the current password.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ParentSettings from '../pages/ParentSettings'
import Settings from '../pages/Settings'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const form = () => screen.getByRole('form', { name: 'Change password' })
const changes = () => apiClient.post.mock.calls.filter(([path]) => path === '/auth/change-password')

async function fillIn({ current = 'Old-password-1', next = 'New-password-1', confirm = next } = {}) {
  const f = form()
  if (current) await userEvent.type(within(f).getByLabelText('Current password'), current)
  if (next) await userEvent.type(within(f).getByLabelText('New password'), next)
  if (confirm) await userEvent.type(within(f).getByLabelText('Confirm new password'), confirm)
  await userEvent.click(within(f).getByRole('button', { name: 'Update password' }))
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
})

describe.each([
  ['manager', () => <Settings />],
  ['admin', () => <Settings role="Admin" />],
  ['guardian', () => <ParentSettings />],
])('Change password for a %s', (role, page) => {
  beforeEach(async () => {
    await signInAs(role)
    render(<MemoryRouter>{page()}</MemoryRouter>)
  })

  it('sends the current and new password, then clears the form', async () => {
    onApi('POST', '/auth/change-password', { message: 'Password updated' })
    await fillIn()
    expect(changes()).toEqual([['/auth/change-password', { currentPassword: 'Old-password-1', newPassword: 'New-password-1' }]])
    expect(await within(form()).findByRole('status')).toHaveTextContent('Password updated.')
    expect(within(form()).getByLabelText('Current password')).toHaveValue('')
  })

  it("shows the server's message when the current password is wrong", async () => {
    onApi('POST', '/auth/change-password', new ApiError('Your current password is incorrect', 400))
    await fillIn()
    expect(await within(form()).findByRole('alert')).toHaveTextContent('Your current password is incorrect')
  })
})

describe('Change password checks before sending', () => {
  beforeEach(async () => {
    await signInAs('manager')
    render(<MemoryRouter><Settings /></MemoryRouter>)
  })

  it.each([
    [{ current: '' }, 'Please fill in all fields.'],
    [{ confirm: 'Something-else-1' }, 'New passwords do not match.'],
    [{ next: 'short', confirm: 'short' }, 'The new password must be at least 8 characters.'],
    [{ current: 'Same-password-1', next: 'Same-password-1' }, 'The new password must be different from your current one.'],
  ])('%o', async (values, message) => {
    await fillIn(values)
    expect(within(form()).getByRole('alert')).toHaveTextContent(message)
    expect(changes()).toHaveLength(0)
  })
})
