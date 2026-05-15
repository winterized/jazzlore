import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ChordSymbolDisplay from './ChordSymbolDisplay'

describe('ChordSymbolDisplay', () => {
  it('renders the primary symbol at prominent size', () => {
    render(<ChordSymbolDisplay primary="Cmaj7" />)
    expect(screen.getByText('Cmaj7')).toBeInTheDocument()
  })

  it('renders both primary and alternate when alternate is provided', () => {
    render(<ChordSymbolDisplay primary="Cmaj7" alternate="CΔ7" />)
    expect(screen.getByText('Cmaj7')).toBeInTheDocument()
    expect(screen.getByText('CΔ7')).toBeInTheDocument()
  })

  it('does not render alternate text when alternate is undefined', () => {
    render(<ChordSymbolDisplay primary="C7" />)
    expect(screen.queryByText('CΔ7')).toBeNull()
  })

  it('preserves vertical space with placeholder when alternate is absent', () => {
    const { container } = render(<ChordSymbolDisplay primary="C7" />)
    // When alternate is absent an aria-hidden placeholder div is rendered
    // so all rows maintain the same height.
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container -- structural check
    const placeholder = container.querySelector('[aria-hidden="true"]')
    expect(placeholder).not.toBeNull()
  })

  it('does NOT render placeholder div when alternate is present', () => {
    const { container } = render(<ChordSymbolDisplay primary="Cmaj7" alternate="CΔ7" />)
    // aria-hidden placeholder should not be present when alternate text is shown
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container -- structural check
    const placeholder = container.querySelector('[aria-hidden="true"]')
    expect(placeholder).toBeNull()
  })

  it('renders without parens around alternate', () => {
    render(<ChordSymbolDisplay primary="Cm" alternate="C-" />)
    const text = screen.getByText('C-').textContent ?? ''
    expect(text).not.toContain('(')
    expect(text).not.toContain(')')
  })

  it('renders correct symbols for diminished chord', () => {
    render(<ChordSymbolDisplay primary="Cdim" alternate="C°" />)
    expect(screen.getByText('Cdim')).toBeInTheDocument()
    expect(screen.getByText('C°')).toBeInTheDocument()
  })
})
