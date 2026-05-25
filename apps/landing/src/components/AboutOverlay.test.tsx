import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AboutOverlay } from './AboutOverlay'

describe('AboutOverlay', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <AboutOverlay open={false} onClose={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the verbatim about copy when open', () => {
    render(<AboutOverlay open={true} onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText(/I built these tools for myself/),
    ).toBeInTheDocument()
    // The italicized phrase is the editorial linchpin — make sure it
    // renders inside its own <em> so styling can hook it. The query
    // matches the exact words from the handoff; if anyone paraphrases
    // (replaces "Musicians is different" with another phrasing), this
    // test fails loudly.
    const emphasis = screen.getByText('Musicians is different')
    expect(emphasis.tagName).toBe('EM')
    expect(
      screen.getByText(
        /This is personal; it doesn't aspire to be the right fit for everyone\./,
      ),
    ).toBeInTheDocument()
  })

  it('closes on backdrop click', () => {
    const onClose = vi.fn()
    render(<AboutOverlay open={true} onClose={onClose} />)
    // Backdrop is a real <button aria-label="Close"> (testability-friendly
    // shorthand; the × button carries the verbose "Close About" label).
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT close when clicking inside the panel', () => {
    const onClose = vi.fn()
    render(<AboutOverlay open={true} onClose={onClose} />)
    // Clicks on the panel itself land on the panel; backdrop is a sibling,
    // not a parent, so there's nothing to bubble to.
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on × button click', () => {
    const onClose = vi.fn()
    render(<AboutOverlay open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close About' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(<AboutOverlay open={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT close on Escape when not open (no key listener mounted)', () => {
    const onClose = vi.fn()
    render(<AboutOverlay open={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
