import { render, screen, act } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

function setOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value })
}

afterEach(() => {
  setOnLine(true)
})

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    setOnLine(true)
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a polite status strip when offline', () => {
    setOnLine(false)
    render(<OfflineBanner />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(
      /currently-loaded content remains available/i,
    )
  })

  it('appears and disappears as connectivity flips', () => {
    setOnLine(true)
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).toBeNull()

    act(() => {
      setOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      setOnLine(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})
