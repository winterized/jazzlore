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
