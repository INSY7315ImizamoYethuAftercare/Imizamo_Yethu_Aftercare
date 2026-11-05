// Parent settings show the signed-in parent's own details, not sample ones.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ParentSettings from '../pages/ParentSettings'
import { ApiError, onApi, resetApi } from './api-mock'
import { signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const ME = {
  fullName: 'Grace Ntombela', contactNumber: '082 555 0101', relationship: 'Mother',
  children: [{ learnerId: 3, name: 'Zoe Ntombela' }],
}

async function renderPage() {
  await signInAs('guardian')
  render(<MemoryRouter><ParentSettings /></MemoryRouter>)
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', [])
})

describe('Parent settings profile', () => {
  it('shows their child and phone number from the server', async () => {
    onApi('GET', '/guardian/me', ME)
    await renderPage()
    expect(await screen.findByText('Zoe Ntombela')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(screen.getByText('082 555 0101')).toBeInTheDocument()
    expect(screen.queryByText(/Aisha Petersen|072 345 6789/)).not.toBeInTheDocument()
  })

  it('lists every child a parent has', async () => {
    onApi('GET', '/guardian/me', { ...ME, children: [...ME.children, { learnerId: 4, name: 'Sipho Ntombela' }] })
    await renderPage()
    expect(await screen.findByText('Zoe Ntombela, Sipho Ntombela')).toBeInTheDocument()
    expect(screen.getByText('Children')).toBeInTheDocument()
  })

  it('says so if the details cannot be loaded', async () => {
    onApi('GET', '/guardian/me', () => { throw new ApiError('Server error', 500) })
    await renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error')
  })
})
