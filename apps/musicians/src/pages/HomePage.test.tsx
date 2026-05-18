import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage'
import { fixtureSource } from '../hooks/useMusicianData'

describe('HomePage', () => {
  it('loads the curated list and renders the hero + curated grid', async () => {
    render(
      <MemoryRouter>
        <HomePage source={fixtureSource} />
      </MemoryRouter>,
    )
    // Async BFF seam resolves the fixture curated list.
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /step into a musician/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: /twelve to begin with/i }),
    ).toBeInTheDocument()
  })
})
