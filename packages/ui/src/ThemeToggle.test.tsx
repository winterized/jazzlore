import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  it('renders the moon glyph when theme is light', () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />)
    // The button's accessible name is "Toggle theme"; the hidden glyph is inside the button text
    expect(screen.getByText('☾')).toBeInTheDocument()
  })

  it('renders the sun glyph when theme is dark', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />)
    expect(screen.getByText('☀︎')).toBeInTheDocument()
  })

  it('aria-pressed is false when theme is light', () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />)
    const btn = screen.getByRole('button', { name: /toggle theme/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('aria-pressed is true when theme is dark', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />)
    const btn = screen.getByRole('button', { name: /toggle theme/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn()
    render(<ThemeToggle theme="light" onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
