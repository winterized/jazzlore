import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SearchBox, { type SearchResult } from './StickyHeader.searchBox'

const RESULTS: SearchResult[] = [
  { id: 'scale-locrian', label: 'Locrian', sublabel: 'Modes of major' },
  { id: 'scale-locrian-nat2', label: 'Locrian ♮2', sublabel: 'Modes of melodic minor' },
]

function setup(over: Partial<React.ComponentProps<typeof SearchBox>> = {}) {
  const onQueryChange = vi.fn()
  const onSelect = vi.fn()
  render(
    <SearchBox
      results={over.results ?? RESULTS}
      onQueryChange={onQueryChange}
      onSelect={onSelect}
      label="Search scales"
      placeholder="Search…"
      {...over}
    />,
  )
  return { onQueryChange, onSelect, input: screen.getByRole('combobox', { name: 'Search scales' }) }
}

describe('SearchBox combobox', () => {
  it('renders a labelled combobox, collapsed when empty', () => {
    const { input } = setup()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('typing emits onQueryChange and opens the listbox with options', async () => {
    const { onQueryChange, input } = setup()
    await userEvent.type(input, 'locr')
    expect(onQueryChange).toHaveBeenLastCalledWith('locr')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('ArrowDown moves aria-activedescendant and wraps', async () => {
    const { input } = setup()
    await userEvent.type(input, 'l')
    await userEvent.keyboard('{ArrowDown}')
    const opts = screen.getAllByRole('option')
    expect(input).toHaveAttribute('aria-activedescendant', opts[0]!.id)
    await userEvent.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', opts[1]!.id)
    await userEvent.keyboard('{ArrowDown}') // wrap
    expect(input).toHaveAttribute('aria-activedescendant', opts[0]!.id)
  })

  it('Enter on the active option selects it and closes', async () => {
    const { onSelect, input } = setup()
    await userEvent.type(input, 'l')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('scale-locrian')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking an option selects it', async () => {
    const { onSelect, input } = setup()
    await userEvent.type(input, 'l')
    await userEvent.click(screen.getByRole('option', { name: /Locrian ♮2/ }))
    expect(onSelect).toHaveBeenCalledWith('scale-locrian-nat2')
  })

  it('Escape closes the list, then clears the query', async () => {
    const { onQueryChange, input } = setup()
    await userEvent.type(input, 'loc')
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('loc')
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveValue('')
    expect(onQueryChange).toHaveBeenLastCalledWith('')
  })

  it('shows a non-selectable "No matches" when the query yields nothing', async () => {
    const { onSelect, input } = setup({ results: [] })
    await userEvent.type(input, 'zzz')
    const opt = screen.getByRole('option')
    expect(opt).toHaveTextContent('No matches')
    expect(opt).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
