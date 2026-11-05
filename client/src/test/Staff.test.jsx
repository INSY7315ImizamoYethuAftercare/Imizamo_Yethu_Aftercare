// Manager's Staff page: adding a teacher with POST /teacher.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Staff from '../pages/Staff'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const NKOSI = { teacher_id: 1, user_id: 5, full_name: 'Ms Nkosi', contact_email: 'nkosi@iylh.org', is_active: true }
const NEW = { teacher_id: 2, user_id: 6, full_name: 'Sipho Dlamini', contact_email: 'sipho@iylh.org', is_active: true }

async function renderStaff() {
  await signInAs('manager')
  render(
    <MemoryRouter>
      <Staff />
    </MemoryRouter>,
  )
  await screen.findByText('Ms Nkosi')
}

async function openAndFill({ name = 'Sipho Dlamini', email = 'sipho@iylh.org', password = 'Starting-pass-1' } = {}) {
  await userEvent.click(screen.getByRole('button', { name: '+ Add teacher' }))
  if (name) await userEvent.type(screen.getByLabelText('FULL NAME'), name)
  if (email) await userEvent.type(screen.getByLabelText('EMAIL (THEY SIGN IN WITH THIS)'), email)
  if (password) await userEvent.type(screen.getByLabelText('STARTING PASSWORD'), password)
}

const teacherPosts = () => apiClient.post.mock.calls.filter(([path]) => path === '/teacher')

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/teacher', [NKOSI])
})

describe('Staff page: add a teacher', () => {
  it('creates the teacher, refreshes the list and confirms', async () => {
    onApi('POST', '/teacher', NEW)
    await renderStaff()
    await openAndFill()
    onApi('GET', '/teacher', [NKOSI, NEW])
    await userEvent.click(screen.getByRole('button', { name: 'Add teacher' }))

    expect(await screen.findByText('Sipho Dlamini was added. Give them their email and starting password to sign in. They\'ll choose their own password the first time.')).toBeInTheDocument()
    expect(screen.getByText('Sipho Dlamini')).toBeInTheDocument()
    expect(teacherPosts()).toEqual([['/teacher', { fullName: 'Sipho Dlamini', email: 'sipho@iylh.org', password: 'Starting-pass-1' }]])
    expect(screen.queryByLabelText('FULL NAME')).not.toBeInTheDocument()
  })

  it.each([
    [{ name: '' }, 'Please fill in every field.'],
    [{ email: 'not-an-email' }, 'Please enter a valid email address.'],
    [{ password: 'short' }, 'The starting password must be at least 8 characters.'],
  ])('checks %o before sending', async (overrides, message) => {
    await renderStaff()
    await openAndFill(overrides)
    await userEvent.click(screen.getByRole('button', { name: 'Add teacher' }))
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(teacherPosts()).toHaveLength(0)
  })

  it('shows the server message, e.g. for an email that is already used (409)', async () => {
    onApi('POST', '/teacher', new ApiError('An account with this email already exists', 409))
    await renderStaff()
    await openAndFill()
    await userEvent.click(screen.getByRole('button', { name: 'Add teacher' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
    expect(screen.getByLabelText('FULL NAME')).toHaveValue('Sipho Dlamini')
  })

  it('Cancel closes the form without saving', async () => {
    await renderStaff()
    await openAndFill()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByLabelText('FULL NAME')).not.toBeInTheDocument()
    expect(teacherPosts()).toHaveLength(0)
  })
})
