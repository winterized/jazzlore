import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { SearchCorpusEntry } from '../../lib/types'
import { Autosuggest } from './Autosuggest'

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}</div>
}

const CORPUS: SearchCorpusEntry[] = [
  { id: 'wikidata:Q93341', name: 'Miles Davis', aka: [], primaryInstrument: 'trumpet' },
  { id: 'wikidata:Q7346', name: 'John Coltrane', aka: [], primaryInstrument: 'tenor sax' },
  { id: 'mb:dupe', name: 'Antoine Hervé', aka: [], primaryInstrument: 'piano' },
  { id: 'wd:Q2856321', name: 'Antoine Hervé', aka: [], primaryInstrument: 'piano' },
  { id: 'wd:jobim', name: 'Antônio Carlos Jobim', aka: ['Tom Jobim'], primaryInstrument: 'piano' },
]

function renderWith(corpus = CORPUS) {
  return render(
    <MemoryRouter initialEntries={['/musicians']}>
      <Autosuggest loadCorpus={async () => ({ corpus })} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
})
afterEach(() => vi.unstubAllGlobals())

describe('Autosuggest — WAI-ARIA combobox', () => {
  it('exposes a combobox input with the iOS-safe ≥16px attrs', () => {
    renderWith()
    const input = screen.getByRole('combobox', { name: /search a musician/i })
    expect(input).toHaveClass('search-input')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('autocorrect', 'off')
    expect(input).toHaveAttribute('autocapitalize', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
    expect(input).toHaveAttribute('inputmode', 'search')
  })

  it('debounces, then shows ≤6 listbox options with accent-folded matches', async () => {
    renderWith()
    const input = screen.getByRole('combobox')
    await userEvent.setup().type(input, 'anto')
    const listbox = await screen.findByRole('listbox')
    expect(listbox).toBeInTheDocument()
    const options = await screen.findAllByRole('option')
    // 2 Antoine Hervé (duplicate kept) + Antônio Carlos Jobim.
    expect(options.length).toBe(3)
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps the known duplicate (no client-side dedup, landmine 11)', async () => {
    renderWith()
    await userEvent.setup().type(screen.getByRole('combobox'), 'antoine herve')
    const options = await screen.findAllByRole('option')
    const labels = options.map((o) => o.textContent)
    expect(labels.filter((l) => /Antoine Hervé/.test(l ?? ''))).toHaveLength(2)
  })

  it('highlights the matched substring via <em> over the ORIGINAL name', async () => {
    renderWith()
    await userEvent.setup().type(screen.getByRole('combobox'), 'mile')
    const option = await screen.findByRole('option', { name: /miles davis/i })
    // The matched run is wrapped in an <em>; "Mile" is its own text node.
    const em = within(option).getByText('Mile')
    expect(em.tagName).toBe('EM')
  })

  it('navigates options with ArrowDown/ArrowUp and sets aria-activedescendant', async () => {
    renderWith()
    const user = userEvent.setup()
    const input = screen.getByRole('combobox')
    await user.type(input, 'anto')
    await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}')
    const activeId = input.getAttribute('aria-activedescendant')
    expect(activeId).toBeTruthy()
    // Exactly one option is aria-selected and it is the activedescendant.
    const options = screen.getAllByRole('option')
    const selected = options.filter(
      (o) => o.getAttribute('aria-selected') === 'true',
    )
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveAttribute('id', activeId)
  })

  it('Enter on the active option navigates to that musician', async () => {
    renderWith()
    const user = userEvent.setup()
    const input = screen.getByRole('combobox')
    await user.type(input, 'mile')
    await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent(
        '/musicians/wikidata%3AQ93341',
      ),
    )
  })

  it('clicking an option (mousedown preventDefault) navigates', async () => {
    renderWith()
    const user = userEvent.setup()
    await user.type(screen.getByRole('combobox'), 'coltr')
    const option = await screen.findByRole('option', { name: /coltrane/i })
    await user.click(option)
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent(
        '/musicians/wikidata%3AQ7346',
      ),
    )
  })

  it('Escape closes the listbox', async () => {
    renderWith()
    const user = userEvent.setup()
    const input = screen.getByRole('combobox')
    await user.type(input, 'anto')
    await screen.findByRole('listbox')
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).toBeNull(),
    )
  })

  it('shows a calm "no matches" line rather than a dead end', async () => {
    renderWith()
    await userEvent.setup().type(screen.getByRole('combobox'), 'zzzznotamatch')
    expect(await screen.findByText(/no matches/i)).toBeInTheDocument()
  })
})
