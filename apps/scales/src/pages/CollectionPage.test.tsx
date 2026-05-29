import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('every saved scale has an "Include in print" checkbox, default checked', () => {
    save({ rootNote: 'C', scaleId: 'dorian' })
    render(
      <MemoryRouter>
        <CollectionPage />
      </MemoryRouter>,
    )
    const cb = screen.getByRole('checkbox', { name: /include.*dorian.*in print/i })
    expect(cb).toBeChecked()
  })

  it('unchecking a row marks its wrapper data-print-include="false"', async () => {
    save({ rootNote: 'C', scaleId: 'dorian' })
    const { container } = render(
      <MemoryRouter>
        <CollectionPage />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: /include.*dorian.*in print/i }))
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- need to query our wrapping data attribute
    expect(container.querySelector('[data-print-include="false"]')).not.toBeNull()
  })

  it('exposes a back link to the scales page', () => {
    render(
      <MemoryRouter>
        <CollectionPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /scales/i })).toHaveAttribute('href', '/scales/C')
  })

  // Safe-area insets (issue #131) — this page renders its own <main> (not
  // wrapped by StickyHeader), so it must apply env(safe-area-inset-*) itself
  // or content runs under the notch / home indicator on notched iPhones.
  // Symmetric with the chords collection page.
  it('applies top and bottom safe-area-inset padding on the page root', () => {
    const { container } = render(
      <MemoryRouter>
        <CollectionPage />
      </MemoryRouter>,
    )
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting the page-root <main> class
    const cls = container.querySelector('main')?.getAttribute('class') ?? ''
    // Pin the property + side (pt-/pb-), not just the env() token.
    expect(cls).toContain('pt-[calc(1rem+env(safe-area-inset-top')
    expect(cls).toContain('pb-[calc(1rem+env(safe-area-inset-bottom')
  })
})
