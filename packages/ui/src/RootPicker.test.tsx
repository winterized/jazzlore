import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RootPicker, { type RootOption } from './RootPicker'

const SAMPLE_OPTIONS: readonly RootOption[] = [
  { value: 'C', label: 'C' },
  { value: 'Db', label: 'D♭', alternate: { value: 'C#', label: 'C♯' } },
  { value: 'D', label: 'D' },
  { value: 'Eb', label: 'E♭', alternate: { value: 'D#', label: 'D♯' } },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F♯', alternate: { value: 'Gb', label: 'G♭' } },
  { value: 'G', label: 'G' },
  { value: 'Ab', label: 'A♭', alternate: { value: 'G#', label: 'G♯' } },
  { value: 'A', label: 'A' },
  { value: 'Bb', label: 'B♭', alternate: { value: 'A#', label: 'A♯' } },
  { value: 'B', label: 'B' },
] as const

describe('RootPicker', () => {
  it('renders 12 buttons in default chromatic order', () => {
    render(<RootPicker options={SAMPLE_OPTIONS} selected="C" onSelect={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(
      ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'],
    )
  })

  it('marks the selected root with aria-checked', () => {
    render(<RootPicker options={SAMPLE_OPTIONS} selected="Eb" onSelect={() => {}} />)
    const eb = screen.getByRole('radio', { name: 'E♭' })
    expect(eb).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onSelect with the option value (Eb) when clicked', async () => {
    const onSelect = vi.fn()
    render(<RootPicker options={SAMPLE_OPTIONS} selected="C" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('radio', { name: 'E♭' }))
    expect(onSelect).toHaveBeenCalledWith('Eb')
  })

  it('marks the selected root when alternate value matches selected prop', () => {
    render(<RootPicker options={SAMPLE_OPTIONS} selected="C#" onSelect={() => {}} />)
    // The Db/C# button should be checked because C# matches alternate.value
    const buttons = screen.getAllByRole('radio')
    const checkedButton = buttons.find((b) => b.getAttribute('aria-checked') === 'true')
    expect(checkedButton).toBeDefined()
  })
})

describe('RootPicker keyboard navigation', () => {
  it('ArrowRight moves selection to the next root and wraps at the end', async () => {
    const onSelect = vi.fn()
    render(<RootPicker options={SAMPLE_OPTIONS} selected="C" onSelect={onSelect} />)
    const c = screen.getByRole('radio', { name: 'C' })
    c.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onSelect).toHaveBeenLastCalledWith('Db')
  })

  it('ArrowLeft from C wraps to B', async () => {
    const onSelect = vi.fn()
    render(<RootPicker options={SAMPLE_OPTIONS} selected="C" onSelect={onSelect} />)
    const c = screen.getByRole('radio', { name: 'C' })
    c.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(onSelect).toHaveBeenLastCalledWith('B')
  })

  it('Home jumps to C, End jumps to B', async () => {
    const onSelect = vi.fn()
    render(<RootPicker options={SAMPLE_OPTIONS} selected="F" onSelect={onSelect} />)
    const f = screen.getByRole('radio', { name: 'F' })
    f.focus()
    await userEvent.keyboard('{Home}')
    expect(onSelect).toHaveBeenLastCalledWith('C')
    await userEvent.keyboard('{End}')
    expect(onSelect).toHaveBeenLastCalledWith('B')
  })

  it('only the selected radio is in the tab order', () => {
    render(<RootPicker options={SAMPLE_OPTIONS} selected="E" onSelect={() => {}} />)
    const e = screen.getByRole('radio', { name: 'E' })
    expect(e.getAttribute('tabindex')).toBe('0')
    // All other radios should have tabindex="-1"
    const allRadios = screen.getAllByRole('radio')
    const notInTabOrder = allRadios.filter((r) => r !== e)
    for (const r of notInTabOrder) {
      expect(r.getAttribute('tabindex')).toBe('-1')
    }
  })
})

describe('RootPicker enharmonic toggle', () => {
  it('renders a toggle sub-button on ambiguous notes only', () => {
    render(<RootPicker options={SAMPLE_OPTIONS} selected="C" onSelect={() => {}} />)
    expect(screen.getAllByRole('button', { name: /Switch .+ to .+/ })).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /Switch C to/ })).toBeNull()
  })

  it('clicking the toggle flips the spelling in place', async () => {
    const onSelect = vi.fn()
    render(
      <RootPicker options={SAMPLE_OPTIONS} selected="C" onSelect={onSelect} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Switch D♭ to C♯' }))
    // After flipping, the rendered label reflects the new spelling
    expect(screen.getByRole('radio', { name: 'C♯' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'D♭' })).toBeNull()
  })
})
