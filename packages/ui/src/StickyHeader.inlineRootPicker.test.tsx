import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import InlineRootPicker from './StickyHeader.inlineRootPicker'
import type { RootOption } from './RootPicker'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const OPTIONS: readonly RootOption[] = [
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
]

function renderPicker(
  overrides: Partial<{ selectedRoot: string; onRootChange: (v: string) => void }> = {},
) {
  const onRootChange = overrides.onRootChange ?? vi.fn()
  const selectedRoot = overrides.selectedRoot ?? 'C'
  return {
    onRootChange,
    ...render(
      <InlineRootPicker
        rootOptions={OPTIONS}
        selectedRoot={selectedRoot}
        onRootChange={onRootChange}
      />,
    ),
  }
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('InlineRootPicker — rendering', () => {
  it('renders 12 radio buttons', () => {
    renderPicker()
    expect(screen.getAllByRole('radio')).toHaveLength(12)
  })

  it('renders buttons in chromatic order with correct labels', () => {
    renderPicker()
    const radios = screen.getAllByRole('radio')
    expect(radios.map((b) => b.textContent?.trim())).toEqual([
      'C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B',
    ])
  })

  // Handoff README "Spacing & sizing": inline root button = 36px wide × 32px
  // tall (w-9 h-8). Regression guard: a previous build had these transposed
  // (w-8 h-9 = 32×36), which made the picker look cramped vs the design.
  it('sizes each root button 36w × 32h per the handoff spec (not transposed)', () => {
    renderPicker()
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveClass('w-9', 'h-8')
      expect(radio).not.toHaveClass('w-8')
      expect(radio).not.toHaveClass('h-9')
    }
  })

  it('renders 5 enharmonic badge buttons (one per ambiguous note)', () => {
    renderPicker()
    // Badges carry aria-label "Show X spelling"
    expect(screen.getAllByRole('button', { name: /Show .+ spelling/i })).toHaveLength(5)
  })
})

// ─── Active state ─────────────────────────────────────────────────────────────

describe('InlineRootPicker — active/selected state', () => {
  it('marks the selected root with aria-checked="true"', () => {
    renderPicker({ selectedRoot: 'E' })
    expect(screen.getByRole('radio', { name: 'E' })).toHaveAttribute('aria-checked', 'true')
  })

  it('all other roots have aria-checked="false"', () => {
    renderPicker({ selectedRoot: 'E' })
    const unchecked = screen.getAllByRole('radio').filter(
      (b) => b.getAttribute('aria-checked') === 'false',
    )
    expect(unchecked).toHaveLength(11)
  })

  it('selected radio is in the tab order; others are not', () => {
    renderPicker({ selectedRoot: 'F' })
    const f = screen.getByRole('radio', { name: 'F' })
    expect(f).toHaveAttribute('tabindex', '0')
    const others = screen.getAllByRole('radio').filter((b) => b !== f)
    for (const b of others) {
      expect(b).toHaveAttribute('tabindex', '-1')
    }
  })

  it('active reflects selectedRoot even when selected via the alternate value', () => {
    // C# is the alternate value for Db option
    renderPicker({ selectedRoot: 'C#' })
    const radios = screen.getAllByRole('radio')
    const checked = radios.filter((b) => b.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
  })
})

// ─── Click interactions ────────────────────────────────────────────────────────

describe('InlineRootPicker — click interactions', () => {
  it('clicking a button calls onRootChange with the displayed value', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    await userEvent.click(screen.getByRole('radio', { name: 'E♭' }))
    expect(onRootChange).toHaveBeenCalledWith('Eb')
  })

  it('clicking the badge flips the displayed spelling WITHOUT calling onRootChange', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    const badge = screen.getByRole('button', { name: 'Show C♯ spelling' })
    await userEvent.click(badge)
    // After flip, the button should now show C♯
    expect(screen.getByRole('radio', { name: 'C♯' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'D♭' })).toBeNull()
    // onRootChange must NOT have been called
    expect(onRootChange).not.toHaveBeenCalled()
  })

  it('clicking the main button after a flip emits the flipped value', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    // Flip Db → C#
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    // Now click the main button (now labeled C♯)
    await userEvent.click(screen.getByRole('radio', { name: 'C♯' }))
    expect(onRootChange).toHaveBeenCalledWith('C#')
  })

  it('badge click does not propagate to the main button', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    // Only the flip happened — onRootChange was NOT called
    expect(onRootChange).not.toHaveBeenCalled()
  })

  it('flipping one option does not affect other options', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    // Flip Db → C#
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    // F# (another ambiguous option) should remain unaffected
    expect(screen.getByRole('radio', { name: 'F♯' })).toBeInTheDocument()
  })
})

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('InlineRootPicker — keyboard navigation (selection follows focus)', () => {
  it('ArrowRight moves focus AND commits selection (ARIA radiogroup model)', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    screen.getByRole('radio', { name: 'C' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'D♭' })).toHaveFocus()
    // Selection follows focus — emits the focused option's displayed value.
    expect(onRootChange).toHaveBeenCalledWith('Db')
  })

  it('ArrowDown is an alias for ArrowRight (parity with RootPicker)', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    screen.getByRole('radio', { name: 'C' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'D♭' })).toHaveFocus()
    expect(onRootChange).toHaveBeenCalledWith('Db')
  })

  it('ArrowUp is an alias for ArrowLeft (parity with RootPicker)', async () => {
    const onRootChange = vi.fn()
    renderPicker({ selectedRoot: 'C', onRootChange })
    screen.getByRole('radio', { name: 'C' }).focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus()
    expect(onRootChange).toHaveBeenCalledWith('B')
  })

  it('ArrowLeft from C wraps to B', async () => {
    renderPicker({ selectedRoot: 'C' })
    const c = screen.getByRole('radio', { name: 'C' })
    c.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus()
  })

  it('Home jumps focus to first button (C)', async () => {
    renderPicker({ selectedRoot: 'F' })
    const f = screen.getByRole('radio', { name: 'F' })
    f.focus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'C' })).toHaveFocus()
  })

  it('End jumps focus to last button (B)', async () => {
    renderPicker({ selectedRoot: 'F' })
    const f = screen.getByRole('radio', { name: 'F' })
    f.focus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus()
  })

  it('ArrowRight wraps from B back to C', async () => {
    renderPicker({ selectedRoot: 'B' })
    const b = screen.getByRole('radio', { name: 'B' })
    b.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'C' })).toHaveFocus()
  })
})

// ─── Badge aria-labels ────────────────────────────────────────────────────────

describe('InlineRootPicker — badge accessibility labels', () => {
  it('badge label reflects the spelling it switches TO (not FROM)', () => {
    renderPicker()
    // Initially: Db shown, badge says "Show C♯ spelling"
    expect(screen.getByRole('button', { name: 'Show C♯ spelling' })).toBeInTheDocument()
  })

  it('badge label updates after flip', async () => {
    renderPicker()
    // Flip Db → C#
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    // Now badge should say "Show D♭ spelling" (switching back)
    expect(screen.getByRole('button', { name: 'Show D♭ spelling' })).toBeInTheDocument()
  })

  it('the badge is keyboard-reachable (no tabIndex=-1) — parity with RootPicker', () => {
    renderPicker()
    const badge = screen.getByRole('button', { name: 'Show C♯ spelling' })
    // A negative tabindex would remove the only keyboard path to the spelling
    // toggle. It must be reachable via Tab (default / non-negative tabindex).
    const ti = badge.getAttribute('tabindex')
    expect(ti === null || Number(ti) >= 0).toBe(true)
  })
})
