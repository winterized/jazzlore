import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PrintDensity from './PrintDensity'

type Density = 'compact' | 'medium' | 'expanded'

describe('PrintDensity', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    localStorage.clear()
    // Reset data-density attribute after each test
    document.documentElement.removeAttribute('data-density')
  })

  // 1. Renders 3 radio buttons
  it('renders three radio buttons for compact, medium, and expanded', () => {
    const onChange = vi.fn()
    render(<PrintDensity density="medium" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: /compact/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /medium/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /expanded/i })).toBeInTheDocument()
  })

  // 2. Controlled: density prop controls which radio is checked
  it('marks the compact radio as checked when density="compact"', () => {
    const onChange = vi.fn()
    render(<PrintDensity density="compact" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: /compact/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /medium/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /expanded/i })).not.toBeChecked()
  })

  it('marks the medium radio as checked when density="medium"', () => {
    const onChange = vi.fn()
    render(<PrintDensity density="medium" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: /compact/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /medium/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /expanded/i })).not.toBeChecked()
  })

  it('marks the expanded radio as checked when density="expanded"', () => {
    const onChange = vi.fn()
    render(<PrintDensity density="expanded" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: /compact/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /medium/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /expanded/i })).toBeChecked()
  })

  // 3. onChange callback fires with the selected density
  it('calls onChange with "compact" when compact radio is clicked', async () => {
    const onChange = vi.fn()
    render(<PrintDensity density="medium" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: /compact/i }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('compact' satisfies Density)
  })

  it('calls onChange with "expanded" when expanded radio is clicked', async () => {
    const onChange = vi.fn()
    render(<PrintDensity density="medium" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: /expanded/i }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('expanded' satisfies Density)
  })

  // 4. Accessibility: fieldset has a legend or aria-label describing the control
  it('has a fieldset with a legend describing print density', () => {
    const onChange = vi.fn()
    const { container } = render(<PrintDensity density="medium" onChange={onChange} />)
    const fieldset = container.querySelector('fieldset')
    expect(fieldset).not.toBeNull()
    // The legend should be present and labelled "Print density:" (visible per
    // WCAG 2.4.6 — visible labels where practical).
    const legend = fieldset?.querySelector('legend')
    expect(legend).not.toBeNull()
    expect(legend?.textContent).toMatch(/Print density/i)
  })

  // 5. Radios are grouped under the same name (keyboard arrow-key navigation)
  it('all radios share the same name attribute for keyboard navigation', () => {
    const onChange = vi.fn()
    render(<PrintDensity density="medium" onChange={onChange} />)
    const radios = screen.getAllByRole('radio')
    const names = radios.map((r) => r.getAttribute('name'))
    expect(new Set(names).size).toBe(1)
  })
})
