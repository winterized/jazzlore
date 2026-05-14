import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ScaleList from './ScaleList'

describe('ScaleList', () => {
  it('shows 7 family group headers', () => {
    render(<ScaleList root="C" />)
    for (const label of [
      'Modes of major',
      'Modes of melodic minor',
      'Modes of harmonic minor',
      'Symmetric',
      'Pentatonic & blues',
      'Bebop',
      'Exotic',
    ]) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('expands Modes of major by default; Modes of melodic minor collapsed', () => {
    render(<ScaleList root="C" />)
    expect(screen.getByRole('heading', { name: /^Ionian$/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^Melodic minor$/ })).toBeNull()
  })

  it('toggles a family on click', async () => {
    render(<ScaleList root="C" />)
    await userEvent.click(screen.getByRole('button', { name: /Modes of melodic minor/ }))
    expect(screen.getByRole('heading', { name: /^Melodic minor$/ })).toBeInTheDocument()
  })
})
