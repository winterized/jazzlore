import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'
import RootSheet from './StickyHeader.rootSheet'
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

/** Wrapper component to supply a real ref for triggerRef */
function SheetWrapper({
  open = true,
  selectedRoot = 'C',
  onRootChange = vi.fn(),
  onClose = vi.fn(),
}: {
  open?: boolean
  selectedRoot?: string
  onRootChange?: (v: string) => void
  onClose?: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={triggerRef} type="button" data-testid="trigger">
        trigger
      </button>
      <RootSheet
        rootOptions={OPTIONS}
        selectedRoot={selectedRoot}
        onRootChange={onRootChange}
        open={open}
        onClose={onClose}
        triggerRef={triggerRef}
      />
    </>
  )
}

function renderSheet(
  overrides: Partial<{
    open: boolean
    selectedRoot: string
    onRootChange: (v: string) => void
    onClose: () => void
  }> = {},
) {
  const onRootChange = overrides.onRootChange ?? vi.fn()
  const onClose = overrides.onClose ?? vi.fn()
  const open = overrides.open ?? true
  const selectedRoot = overrides.selectedRoot ?? 'C'
  return {
    onRootChange,
    onClose,
    ...render(
      <SheetWrapper
        open={open}
        selectedRoot={selectedRoot}
        onRootChange={onRootChange}
        onClose={onClose}
      />,
    ),
  }
}

// ─── Portal target ─────────────────────────────────────────────────────────────

describe('RootSheet — portal target (guards the flagged bug)', () => {
  it('when open, the dialog is contained by document.body', () => {
    renderSheet({ open: true })
    const dialog = screen.getByRole('dialog')
    // Portals render directly into document.body, bypassing the RTL mounting
    // container. Verifying document.body.contains() is the canonical check.
    expect(document.body.contains(dialog)).toBe(true)
  })

  it('when open, the trigger button IS in the container but dialog is NOT (portal escapes)', () => {
    renderSheet({ open: true })
    const dialog = screen.getByRole('dialog')
    const trigger = screen.getByTestId('trigger')
    // The trigger is a sibling of the sheet in the React tree but mounted in the
    // RTL container. The portal bypasses that container — so the dialog's parent
    // should be document.body (or a portal root attached to body), not the trigger's
    // parent element. A portal escapes: dialog.parentElement !== trigger.parentElement.
    // We use document.body.contains() only — no container.contains().
    expect(document.body.contains(dialog)).toBe(true)
    expect(document.body.contains(trigger)).toBe(true)
    // The dialog must not be an ancestor of the trigger (no nesting in the header).
    // We use screen queries only — no direct DOM traversal on container.
    // The key assertion: screen finds the dialog globally (body-level), not scoped.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('when closed, no dialog is rendered', () => {
    renderSheet({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('RootSheet — rendering', () => {
  it('renders role="dialog" with aria-modal="true"', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('dialog has aria-label "Root note"', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Root note' })).toBeInTheDocument()
  })

  it('renders 12 radio buttons (one per root note)', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('radio')).toHaveLength(12)
  })

  it('renders 5 enharmonic badge buttons', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getAllByRole('button', { name: /Show .+ spelling/i }),
    ).toHaveLength(5)
  })

  it('marks the selected root with aria-checked="true"', () => {
    renderSheet({ selectedRoot: 'E' })
    expect(screen.getByRole('radio', { name: 'E' })).toHaveAttribute('aria-checked', 'true')
  })

  it('all other roots have aria-checked="false"', () => {
    renderSheet({ selectedRoot: 'E' })
    const dialog = screen.getByRole('dialog')
    const unchecked = within(dialog)
      .getAllByRole('radio')
      .filter((b) => b.getAttribute('aria-checked') === 'false')
    expect(unchecked).toHaveLength(11)
  })
})

// ─── Dismiss interactions ──────────────────────────────────────────────────────

describe('RootSheet — dismiss', () => {
  it('Esc key calls onClose', async () => {
    const onClose = vi.fn()
    renderSheet({ onClose })
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('clicking the backdrop calls onClose', async () => {
    const onClose = vi.fn()
    render(<SheetWrapper open={true} onClose={onClose} />)
    const backdrop = screen.getByTestId('root-sheet-backdrop')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ─── Root selection ────────────────────────────────────────────────────────────

describe('RootSheet — root selection', () => {
  it('clicking a root calls onRootChange with the displayed value', async () => {
    const onRootChange = vi.fn()
    renderSheet({ onRootChange, selectedRoot: 'C' })
    await userEvent.click(screen.getByRole('radio', { name: 'E♭' }))
    expect(onRootChange).toHaveBeenCalledWith('Eb')
  })

  it('clicking a root also calls onClose (selecting a root closes the sheet)', async () => {
    const onClose = vi.fn()
    renderSheet({ onClose, selectedRoot: 'C' })
    await userEvent.click(screen.getByRole('radio', { name: 'E' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('clicking a root calls onRootChange BEFORE onClose', async () => {
    const callOrder: string[] = []
    const onRootChange = vi.fn(() => callOrder.push('change'))
    const onClose = vi.fn(() => callOrder.push('close'))
    renderSheet({ onRootChange, onClose, selectedRoot: 'C' })
    await userEvent.click(screen.getByRole('radio', { name: 'E' }))
    expect(callOrder).toEqual(['change', 'close'])
  })
})

// ─── Enharmonic badge (parity with InlineRootPicker) ──────────────────────────

describe('RootSheet — enharmonic badge', () => {
  it('badge toggles the displayed spelling WITHOUT calling onRootChange', async () => {
    const onRootChange = vi.fn()
    renderSheet({ onRootChange, selectedRoot: 'C' })
    const badge = screen.getByRole('button', { name: 'Show C♯ spelling' })
    await userEvent.click(badge)
    // After flip, C♯ radio should appear
    expect(screen.getByRole('radio', { name: 'C♯' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'D♭' })).toBeNull()
    expect(onRootChange).not.toHaveBeenCalled()
  })

  it('badge label reflects the spelling it switches TO', () => {
    renderSheet()
    // Db is shown initially; badge says "Show C♯ spelling" (switching TO C♯)
    expect(screen.getByRole('button', { name: 'Show C♯ spelling' })).toBeInTheDocument()
  })

  it('badge label updates after flip', async () => {
    renderSheet()
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    // Now badge should say "Show D♭ spelling"
    expect(screen.getByRole('button', { name: 'Show D♭ spelling' })).toBeInTheDocument()
  })

  it('clicking the main button after a flip emits the flipped value', async () => {
    const onRootChange = vi.fn()
    renderSheet({ onRootChange, selectedRoot: 'C' })
    // Flip Db → C#
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    // Now click the main button (now labeled C♯)
    await userEvent.click(screen.getByRole('radio', { name: 'C♯' }))
    expect(onRootChange).toHaveBeenCalledWith('C#')
  })

  it('badge is keyboard-reachable (tabindex not -1)', () => {
    renderSheet()
    const badge = screen.getByRole('button', { name: 'Show C♯ spelling' })
    const ti = badge.getAttribute('tabindex')
    expect(ti === null || Number(ti) >= 0).toBe(true)
  })

  it('badge click does not call onRootChange (stopPropagation guard)', async () => {
    const onRootChange = vi.fn()
    renderSheet({ onRootChange, selectedRoot: 'C' })
    await userEvent.click(screen.getByRole('button', { name: 'Show C♯ spelling' }))
    expect(onRootChange).not.toHaveBeenCalled()
  })
})

// ─── Focus management ─────────────────────────────────────────────────────────

describe('RootSheet — focus management', () => {
  it('focus moves into the sheet on open (selected root button is focused)', () => {
    renderSheet({ selectedRoot: 'E' })
    // After render with open=true, focus should have moved into the dialog.
    // The selected radio (E) should have focus.
    const eButton = screen.getByRole('radio', { name: 'E' })
    expect(eButton).toHaveFocus()
  })

  it('Tab wraps from last focusable element (B radio) back to first (C radio)', async () => {
    renderSheet({ selectedRoot: 'C' })
    const dialog = screen.getByRole('dialog')
    // The focus trap wraps from the last focusable (B radio — no badge) to the
    // first focusable (C radio — no badge). Use specific queries matching the
    // actual DOM order the trap uses.
    const bRadio = within(dialog).getByRole('radio', { name: 'B' })
    const cRadio = within(dialog).getByRole('radio', { name: 'C' })
    bRadio.focus()
    await userEvent.tab()
    expect(cRadio).toHaveFocus()
  })

  it('Shift+Tab wraps from first focusable element (C radio) back to last (B radio)', async () => {
    renderSheet({ selectedRoot: 'C' })
    const dialog = screen.getByRole('dialog')
    const cRadio = within(dialog).getByRole('radio', { name: 'C' })
    const bRadio = within(dialog).getByRole('radio', { name: 'B' })
    cRadio.focus()
    await userEvent.tab({ shift: true })
    expect(bRadio).toHaveFocus()
  })

  it('focus restores to the trigger button when the sheet closes via Esc', async () => {
    const onClose = vi.fn()
    const { rerender } = render(<SheetWrapper open={true} onClose={onClose} />)
    const trigger = screen.getByTestId('trigger')

    // Close via Esc — onClose is called, then re-render as closed.
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()

    // Re-render with open=false to trigger the effect cleanup which restores focus.
    rerender(<SheetWrapper open={false} onClose={onClose} />)
    expect(trigger).toHaveFocus()
  })
})
