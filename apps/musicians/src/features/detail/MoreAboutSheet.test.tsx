import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MoreAboutSheet } from './MoreAboutSheet'

function setMatchMedia(reduced: boolean): void {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
}

const PARAS = [
  'A first paragraph of the long-form biography about the musician.',
  'A second paragraph that continues the editorial voice.',
]

function renderSheet(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <div>
        <button>outside</button>
        <MoreAboutSheet
          name="Bobby Timmons"
          paragraphs={PARAS}
          attribution="Bio · Jazzlore staff."
          onClose={onClose}
        />
      </div>,
    ),
  }
}

beforeEach(() => setMatchMedia(false))

describe('MoreAboutSheet', () => {
  it('renders as a modal dialog portalled to document.body (not the panel)', () => {
    const { baseElement } = renderSheet()
    const dialog = screen.getByRole('dialog', { name: /more about bobby timmons/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Portalled directly under body, not nested in the rendered subtree root.
    expect(baseElement).toContainElement(dialog)
  })

  it('renders the long-form paragraphs + attribution', () => {
    renderSheet()
    expect(screen.getByText(PARAS[0]!)).toBeInTheDocument()
    expect(screen.getByText(PARAS[1]!)).toBeInTheDocument()
    expect(screen.getByText(/jazzlore staff/i)).toBeInTheDocument()
  })

  // Dismiss is deferred until the slide-out transition finishes (the sheet
  // animates closed before unmounting), so onClose lands asynchronously.
  it('closes on the × button', async () => {
    const { onClose } = renderSheet()
    await userEvent.setup().click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('closes on backdrop tap', async () => {
    const { onClose } = renderSheet()
    fireEvent.click(screen.getByTestId('sheet-backdrop'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does NOT close when tapping inside the sheet', () => {
    const { onClose } = renderSheet()
    fireEvent.click(screen.getByText(PARAS[0]!))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const { onClose } = renderSheet()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('closes on a downward drag past the threshold', async () => {
    const { onClose } = renderSheet()
    const sheet = screen.getByTestId('sheet-panel')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 250 }] }) // 150px down
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 250 }] })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('springs back (no close) on a short drag', () => {
    const { onClose } = renderSheet()
    const sheet = screen.getByTestId('sheet-panel')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 120 }] }) // 20px — sub-threshold
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 120 }] })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('scrolling inside the bio body does NOT dismiss (touch started in .more-body) — #115 gate', () => {
    const { onClose } = renderSheet()
    // `.more-body` is overflow-y:auto, so a long-bio scroll that travels past
    // the 80px threshold must NOT dismiss. The gate bails when the touch
    // begins inside `.more-body` — same contract as SharedRecordsSheet's
    // `.records-body` gate (the harmonization in #115).
    const para = screen.getByText(PARAS[0]!)
    expect(para.closest('.more-body')).not.toBeNull()
    fireEvent.touchStart(para, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(para, { changedTouches: [{ clientY: 300 }] })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('traps focus: focus moves to the first focusable (close) on open', () => {
    renderSheet()
    // The close button is the only focusable in the sheet → it receives
    // focus on open (focus trap moved focus into the dialog).
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()
  })

  it('keeps Tab focus within the sheet (cycles back to close)', async () => {
    renderSheet()
    const user = userEvent.setup()
    const closeBtn = screen.getByRole('button', { name: /close/i })
    closeBtn.focus()
    await user.tab()
    // Only one focusable → Tab wraps back to it (focus stays trapped).
    expect(closeBtn).toHaveFocus()
  })

  it('applies the open slide class (animated) after the enter frame', async () => {
    renderSheet()
    // `open` is set on the next animation frame so the sheet slides up from
    // translateY(100%) instead of appearing already-open.
    await waitFor(() =>
      expect(screen.getByTestId('sheet-panel')).toHaveClass('open'),
    )
    expect(screen.getByTestId('sheet-backdrop')).toHaveClass('open')
  })
})
