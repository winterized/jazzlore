import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders the Jazzlore Musicians heading', () => {
    render(<HomePage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /jazzlore musicians/i }),
    ).toBeInTheDocument()
  })
})
