import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { save } from '../features/collection/collectionStore'
import CollectionPage from './CollectionPage'

describe('CollectionPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('shows "no saved scales" placeholder when empty', () => {
    render(
      <MemoryRouter>
        <CollectionPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/no saved scales/i)).toBeInTheDocument()
  })

  it('lists saved scales by row', () => {
    save({ rootNote: 'C', scaleId: 'dorian' })
    save({ rootNote: 'Bb', scaleId: 'altered' })
    render(
      <MemoryRouter>
        <CollectionPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /^Dorian$/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Altered$/ })).toBeInTheDocument()
  })
})
