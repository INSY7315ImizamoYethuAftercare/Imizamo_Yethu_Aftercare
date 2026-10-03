// Login form: validation, payload, role-based landing, API errors.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from '../pages/Login'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { USERS, signOutCompletely } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

// Found by their labels, the way a screen reader announces them.
const emailInput = () => screen.getByLabelText('EMAIL')
const passwordInput = () => screen.getByLabelText('PASSWORD')

async function renderLogin() {
  await signOutCompletely()
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<p>teacher home</p>} />
        <Route path="/manager" element={<p>manager home</p>} />
        <Route path="/admin" element={<p>admin home</p>} />
        <Route path="/parent" element={<p>parent home</p>} />
        <Route path="/register" element={<p>register page</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return container
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/auth/me', new ApiError('Not authenticated', 401))
})

describe('Login', () => {
  it('renders the role cards, inputs and sign-in button', async () => {
    const c = await renderLogin()
    for (const name of ['Teacher', 'Manager', 'Admin', 'Parent/Guardian']) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()
    }
    expect(emailInput(c)).toBeInTheDocument()
    expect(passwordInput(c)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('shows a validation message and calls no API when fields are empty', async () => {
    await renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getByText('Please enter your email and password.')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalledWith('/auth/login', expect.anything())
  })

  it('posts the trimmed email and password', async () => {
    onApi('POST', '/auth/login', { user: USERS.teacher })
    const c = await renderLogin()
    await userEvent.type(emailInput(c), '  nkosi@iylh.org  ')
    await userEvent.type(passwordInput(c), 'secret-pw')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'nkosi@iylh.org', password: 'secret-pw' })
  })

  it.each([
    ['teacher', 'teacher home'],
    ['manager', 'manager home'],
    ['admin', 'admin home'],
    ['guardian', 'parent home'],
  ])('sends a %s to their home page', async (role, landing) => {
    onApi('POST', '/auth/login', { user: USERS[role] })
    const c = await renderLogin()
    await userEvent.type(emailInput(c), USERS[role].email)
    await userEvent.type(passwordInput(c), 'pw')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText(landing)).toBeInTheDocument()
  })

  it('lands on the real account role, not the card that was picked', async () => {
    onApi('POST', '/auth/login', { user: USERS.guardian })
    const c = await renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /Admin/ }))
    await userEvent.type(emailInput(c), USERS.guardian.email)
    await userEvent.type(passwordInput(c), 'pw')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText('parent home')).toBeInTheDocument()
  })

  it.each([
    [new ApiError('Invalid email or password', 401), 'Invalid email or password'],
    [new ApiError('This account has been deactivated', 403), 'This account has been deactivated'],
    [new ApiError('Too many requests, please try again later.', 429), 'Too many requests, please try again later.'],
  ])('shows the server message on failure (%s)', async (error, text) => {
    onApi('POST', '/auth/login', error)
    const c = await renderLogin()
    await userEvent.type(emailInput(c), 'x@y.z')
    await userEvent.type(passwordInput(c), 'pw')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
  })

  it('links to registration', async () => {
    await renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /Create an account/ }))
    expect(screen.getByText('register page')).toBeInTheDocument()
  })
})
