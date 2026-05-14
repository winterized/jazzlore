import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import PrintDensity from './PrintDensity'

describe('PrintDensity', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-density')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-density')
  })

  it('defaults to 2-per-row', () => {
    render(<PrintDensity />)
    expect(screen.getByRole('radio', { name: '2 per row' })).toBeChecked()
  })

  it('persists choice and sets data-density on html', async () => {
    render(<PrintDensity />)
    await userEvent.click(screen.getByRole('radio', { name: '3 per row' }))
    expect(localStorage.getItem('jazzlore:scales-print:v1')).toBe('3')
    expect(document.documentElement.getAttribute('data-density')).toBe('3')
  })
})
