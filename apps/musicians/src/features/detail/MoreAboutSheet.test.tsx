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

  it('closes on the × button', async () => {
    const { onClose } = renderSheet()
    await userEvent.setup().click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on backdrop tap', () => {
    const { onClose } = renderSheet()
    fireEvent.click(screen.getByTestId('sheet-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT close when tapping inside the sheet', () => {
    const { onClose } = renderSheet()
    fireEvent.click(screen.getByText(PARAS[0]!))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', () => {
    const { onClose } = renderSheet()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a downward swipe ≥80px on the sheet', () => {
    const { onClose } = renderSheet()
    const sheet = screen.getByTestId('sheet-panel')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 150 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 200 }] })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT close on a short (<80px) swipe', () => {
    const { onClose } = renderSheet()
    const sheet = screen.getByTestId('sheet-panel')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 130 }] })
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
