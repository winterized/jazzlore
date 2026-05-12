import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RootPicker from './RootPicker'

describe('RootPicker', () => {
  it('renders 12 buttons in default chromatic order', () => {
    render(<RootPicker selected="C" onSelect={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(
      ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'],
    )
  })

  it('marks the selected root with aria-checked', () => {
    render(<RootPicker selected="E♭" onSelect={() => {}} />)
    const eb = screen.getByRole('radio', { name: 'E♭' })
    expect(eb).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onSelect with the internal root form (Eb) when clicked', async () => {
    const onSelect = vi.fn()
    render(<RootPicker selected="C" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('radio', { name: 'E♭' }))
    expect(onSelect).toHaveBeenCalledWith('Eb')
  })
})

describe('RootPicker enharmonic toggle', () => {
  it('renders a toggle sub-button on ambiguous notes only', () => {
    render(<RootPicker selected="C" onSelect={() => {}} />)
    expect(screen.getAllByRole('button', { name: /Switch .+ to .+/ })).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /Switch C to/ })).toBeNull()
  })

  it('clicking the toggle flips the spelling in place', async () => {
    const onSelect = vi.fn()
    let spelling: Record<string, string> = {}
    const onSpellingChange = (s: Record<string, string>) => { spelling = s }
    render(
      <RootPicker selected="C" onSelect={onSelect} onSpellingChange={onSpellingChange} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Switch D-flat to C-sharp' }))
    expect(spelling).toEqual({ Db: 'C#' })
    // After flipping, the rendered label reflects the new spelling
    expect(screen.getByRole('radio', { name: 'C♯' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'D♭' })).toBeNull()
  })
})
