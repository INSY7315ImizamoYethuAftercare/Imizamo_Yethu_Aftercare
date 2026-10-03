// Parent/guardian self-registration: validation, the payload sent to
// POST /auth/register, the success message on the sign-in page, and errors.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { signOutCompletely } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const VALID = {
  'FIRST NAME': 'Fatima',
  'LAST NAME': 'Petersen',
  'EMAIL ADDRESS': 'fatima@example.com',
  'PHONE NUMBER': '082 123 4567',
  'YOUR CHILD’S FULL NAME': 'Aisha Petersen',
  'PASSWORD': 'A-strong-password-1',
  'CONFIRM PASSWORD': 'A-strong-password-1',
}

async function renderRegister() {
  await signOutCompletely()
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fill(overrides = {}) {
  const values = { ...VALID, ...overrides }
  for (const [label, value] of Object.entries(values)) {
    if (value) await userEvent.type(screen.getByLabelText(label), value)
  }
  await userEvent.selectOptions(screen.getByLabelText('RELATIONSHIP TO YOUR CHILD'), overrides.relationship ?? 'Mother')
  const dob = screen.getByLabelText('YOUR CHILD’S DATE OF BIRTH')
  await userEvent.clear(dob)
  if (overrides.dob !== '') await userEvent.type(dob, overrides.dob ?? '2018-03-14')
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Create Account' }))
const registerCalls = () => apiClient.post.mock.calls.filter(([path]) => path === '/auth/register')

beforeEach(() => {
  resetApi()
  onApi('GET', '/auth/me', new ApiError('Not authenticated', 401))
})

describe('Register page', () => {
  it('is for parents only: no staff roles or access code, and says who creates staff accounts', async () => {
    await renderRegister()
    expect(screen.getByText('Parent / Guardian')).toBeInTheDocument()
    expect(screen.getByText('Staff accounts are created by the manager.')).toBeInTheDocument()
    for (const role of ['Teacher', 'Manager', 'Admin']) {
      expect(screen.queryByRole('button', { name: new RegExp(role) })).not.toBeInTheDocument()
    }
    expect(screen.queryByText(/STAFF ACCESS CODE|IYLH2025/)).not.toBeInTheDocument()
  })

  it('asks for every field before sending anything', async () => {
    await renderRegister()
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Please fill in every field.')
    expect(registerCalls()).toHaveLength(0)
  })

  it.each([
    [{ 'EMAIL ADDRESS': 'not-an-email' }, 'Please enter a valid email address.'],
    [{ PASSWORD: 'short', 'CONFIRM PASSWORD': 'short' }, 'Your password must be at least 8 characters.'],
    [{ 'CONFIRM PASSWORD': 'Something-else-1' }, "The two passwords don't match."],
    [{ dob: '' }, 'Please fill in every field.'],
  ])('rejects %o with a clear message', async (overrides, message) => {
    await renderRegister()
    await fill(overrides)
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(registerCalls()).toHaveLength(0)
  })

  it('sends a guardian registration and lands on sign-in with a success message', async () => {
    onApi('POST', '/auth/register', { userId: 10, email: 'fatima@example.com', role: 'guardian' })
    await renderRegister()
    await fill()
    await submit()

    expect(await screen.findByRole('status')).toHaveTextContent('Account created. Please sign in.')
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(registerCalls()).toEqual([[
      '/auth/register',
      {
        email: 'fatima@example.com',
        password: 'A-strong-password-1',
        role: 'guardian',
        fullName: 'Fatima Petersen',
        contactNumber: '082 123 4567',
        relationship: 'Mother',
        claimedLearnerName: 'Aisha Petersen',
        claimedLearnerDob: '2018-03-14',
      },
    ]])
  })

  it('explains when no learner matches the name and date of birth (404)', async () => {
    onApi('POST', '/auth/register', new ApiError('No learner found matching that name and date of birth', 404))
    await renderRegister()
    await fill()
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't find a learner with that name and date of birth/)
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled()
  })

  it('shows the server message, e.g. for an email that is already registered (409)', async () => {
    onApi('POST', '/auth/register', new ApiError('An account with this email already exists', 409))
    await renderRegister()
    await fill()
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
  })

  it('goes back to sign-in', async () => {
    await renderRegister()
    await userEvent.click(screen.getByRole('button', { name: '← Back to Sign In' }))
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })
})
