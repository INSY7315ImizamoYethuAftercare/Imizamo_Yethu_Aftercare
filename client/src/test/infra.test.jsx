import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

describe('client test infrastructure', () => {
  it('renders into jsdom with jest-dom and jest-axe matchers', async () => {
    const { container } = render(<button type="button">Hello</button>)
    expect(screen.getByRole('button', { name: 'Hello' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('blocks real network calls', async () => {
    await expect(fetch('/api/health')).rejects.toThrow(/Real network call/)
  })
})
