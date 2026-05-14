import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StarButton from './StarButton'

describe('StarButton', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('toggles save state on click', async () => {
    render(<StarButton rootNote="C" scaleId="dorian" />)
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })
})
