import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ChordCollectionPage from './ChordCollectionPage'
import { addChord, removeChord } from '../features/collection/chordCollectionStore'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/collection/chords']}>
      <ChordCollectionPage />
    </MemoryRouter>,
  )

describe('ChordCollectionPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  // 1. Empty state when no chords saved
  it('shows empty state message when no chords are saved', () => {
    renderPage()
    expect(screen.getByText(/no saved chords yet/i)).toBeDefined()
  })

  it('has a link to /chords/C in the empty state', () => {
    renderPage()
    const links = screen.getAllByRole('link', { name: /chords/i })
    // Both the "← Chords" breadcrumb and the "browse chords" link point to /chords/C
    expect(links.some((l) => l.getAttribute('href') === '/chords/C')).toBe(true)
  })

  // 2. Renders ChordRow for each saved chord in correct order
  it('renders one chord-row per saved chord', () => {
    addChord('C', 'maj7')
    addChord('C', '7')
    renderPage()
    const rows = screen.getAllByTestId('chord-row')
    expect(rows).toHaveLength(2)
  })

  // 3. Sample test: save Cmaj7 + B♭m7, render page, both rows appear
  it('shows Cmaj7 and B♭m7 rows when both are saved', () => {
    addChord('C', 'maj7')
    addChord('B♭', 'm7')
    renderPage()
    expect(screen.getAllByTestId('chord-row')).toHaveLength(2)
  })

  // 4. Defensive: unknown chordId is skipped gracefully
  it('skips a saved entry whose chordId is not in CURATED_CHORDS', () => {
    // Manually inject a stale entry with an unknown id via localStorage
    localStorage.setItem(
      'jazzlore:chords:v1',
      JSON.stringify([
        { rootNote: 'C', chordId: 'maj7', savedAt: new Date().toISOString() },
        { rootNote: 'C', chordId: 'obsoleteChord', savedAt: new Date().toISOString() },
      ]),
    )
    renderPage()
    // Only the valid chord should appear as a row
    expect(screen.getAllByTestId('chord-row')).toHaveLength(1)
  })

  // 5. Page title
  it('sets the document title to "My chord collection — Jazzlore"', () => {
    renderPage()
    expect(document.title).toBe('My chord collection — Jazzlore')
  })

  // 6. Breadcrumb back link
  it('has a "← Chords" link back to /chords/C', () => {
    renderPage()
    expect(screen.getByRole('link', { name: '← Chords' })).toHaveAttribute('href', '/chords/C')
  })

  // 7. Unstarring a chord from the collection page removes it from the list
  it('removes a row when the user unstars a chord via the star button', async () => {
    addChord('C', 'maj7')
    addChord('C', '7')
    renderPage()
    expect(screen.getAllByTestId('chord-row')).toHaveLength(2)

    // Click the "Remove Cmaj7 from my collection" star button
    const removeBtn = screen.getByRole('button', { name: 'Remove Cmaj7 from my collection' })
    await userEvent.click(removeBtn)

    // After unstarring, only one row remains
    expect(screen.getAllByTestId('chord-row')).toHaveLength(1)
  })

  // 8. Safe-area insets (issue #131) — the page renders its own <main>
  // (not wrapped by StickyHeader), so it must apply env(safe-area-inset-*)
  // itself or content runs under the notch / home indicator on notched iPhones.
  it('applies top and bottom safe-area-inset padding on the page root', () => {
    const { container } = renderPage()
    const main = container.querySelector('main')
    const cls = main?.getAttribute('class') ?? ''
    // Pin the property + side (pt-/pb-), not just the env() token.
    expect(cls).toContain('pt-[calc(1rem+env(safe-area-inset-top')
    expect(cls).toContain('pb-[calc(1rem+env(safe-area-inset-bottom')
  })

  // Print toolbar hidden inside the Capacitor native shell (window.print() is
  // a no-op in WKWebView, #135). Density control goes with it — print-only UI.
  it('hides the print toolbar (button + density) inside the native shell', () => {
    addChord('C', 'maj7')
    Object.defineProperty(window, 'Capacitor', {
      value: { isNativePlatform: () => true },
      configurable: true,
    })
    try {
      renderPage()
      expect(screen.queryByRole('button', { name: /print collection/i })).toBeNull()
      expect(screen.queryByText(/print density/i)).toBeNull()
      // The collection itself still renders.
      expect(screen.getAllByTestId('chord-row')).toHaveLength(1)
    } finally {
      Reflect.deleteProperty(window, 'Capacitor')
    }
  })

  it('shows the print toolbar in a normal browser tab', () => {
    addChord('C', 'maj7')
    renderPage()
    expect(
      screen.getByRole('button', { name: /print collection/i }),
    ).toBeInTheDocument()
  })

  // 9. removeChord external call causes reactive update
  it('updates reactively when removeChord is called externally', () => {
    addChord('C', 'maj7')
    renderPage()
    expect(screen.getAllByTestId('chord-row')).toHaveLength(1)
    // Wrap external store mutation in act() so React processes the state update
    act(() => {
      removeChord('C', 'maj7')
    })
    // The subscription should update the component; empty state appears
    expect(screen.getByText(/no saved chords yet/i)).toBeDefined()
  })
})
