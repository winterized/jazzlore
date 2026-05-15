import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RootCompactButton from './StickyHeader.rootCompactButton'
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

function renderButton(
  overrides: Partial<{
    selectedRoot: string
    onRootChange: (v: string) => void
  }> = {},
) {
  const onRootChange = overrides.onRootChange ?? vi.fn()
  const selectedRoot = overrides.selectedRoot ?? 'C'
  return {
    onRootChange,
    ...render(
      <RootCompactButton
        rootOptions={OPTIONS}
        selectedRoot={selectedRoot}
        onRootChange={onRootChange}
      />,
    ),
  }
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('RootCompactButton — rendering', () => {
  it('shows the selectedRoot label on the button', () => {
    renderButton({ selectedRoot: 'C' })
    // Button text contains "C" + the hidden chevron
    const btn = screen.getByRole('button', { name: /C/i })
    expect(btn).toBeInTheDocument()
    expect(btn.textContent).toContain('C')
  })

  it('shows the label for an alternate value (C# → C♯)', () => {
    renderButton({ selectedRoot: 'C#' })
    const btn = screen.getByRole('button', { name: /C♯/i })
    expect(btn.textContent).toContain('C♯')
  })

  it('has aria-haspopup="dialog"', () => {
    renderButton()
    const btn = screen.getByRole('button', { name: /C/i })
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('aria-expanded is false initially', () => {
    renderButton()
    const btn = screen.getByRole('button', { name: /C/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
})

// ─── Open / close interactions ─────────────────────────────────────────────────

describe('RootCompactButton — open/close', () => {
  it('clicking the button shows the sheet (aria-expanded becomes true)', async () => {
    renderButton()
    const btn = screen.getByRole('button', { name: /C/i })
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking the button opens the dialog', async () => {
    renderButton()
    await userEvent.click(screen.getByRole('button', { name: /C/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('the dialog has aria-label "Root note"', async () => {
    renderButton()
    await userEvent.click(screen.getByRole('button', { name: /C/i }))
    expect(screen.getByRole('dialog', { name: 'Root note' })).toBeInTheDocument()
  })
})
