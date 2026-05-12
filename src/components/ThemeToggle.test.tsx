import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('toggles data-theme on the html element', async () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole('button', { name: /toggle theme/i })
    await userEvent.click(btn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    await userEvent.click(btn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('persists the override in localStorage', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(localStorage.getItem('jazzlore:theme:v1')).toBe('"dark"')
  })
})
