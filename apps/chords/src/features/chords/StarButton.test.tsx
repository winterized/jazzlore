import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StarButton from './StarButton'
import { addChord } from '../collection/chordCollectionStore'

describe('StarButton', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  // 1. Renders ☆ when not starred; ★ when starred
  it('renders ☆ (hollow star) when chord is not saved', () => {
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    expect(screen.getByText('☆')).toBeDefined()
  })

  it('renders ★ (filled star) when chord is already saved', () => {
    addChord('C', 'maj7')
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    expect(screen.getByText('★')).toBeDefined()
  })

  // 2. aria-pressed matches starred state
  it('aria-pressed is false when not starred', () => {
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('aria-pressed is true when starred', () => {
    addChord('C', 'maj7')
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  // 3. aria-label swaps based on starred state
  it('aria-label says "Save … to my collection" when not starred', () => {
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    expect(
      screen.getByRole('button', { name: 'Save Cmaj7 to my collection' }),
    ).toBeDefined()
  })

  it('aria-label says "Remove … from my collection" when starred', () => {
    addChord('C', 'maj7')
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    expect(
      screen.getByRole('button', { name: 'Remove Cmaj7 from my collection' }),
    ).toBeDefined()
  })

  // 4. Click toggles state and persists
  it('clicking the button toggles from unstarred to starred', async () => {
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    const btn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('★')).toBeDefined()
  })

  it('clicking again toggles back to unstarred', async () => {
    render(<StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />)
    const btn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(btn)
    // Now it's starred; click to unstar
    const starredBtn = screen.getByRole('button', { name: /remove/i })
    await userEvent.click(starredBtn)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  // 5. Re-rendering with new props doesn't lose subscription
  it('reacts to external store changes (subscription stays live)', async () => {
    const { rerender } = render(
      <StarButton rootNote="C" chordId="maj7" primary="Cmaj7" />,
    )
    // Star via user click
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    // Re-render with different primary label (prop change)
    rerender(<StarButton rootNote="C" chordId="maj7" primary="CΔ7" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })
})
