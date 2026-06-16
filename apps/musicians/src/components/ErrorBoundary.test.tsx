import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('kaboom')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('catches a render crash and shows the calm error screen, not a blank page', () => {
    // React logs caught errors to console.error; silence it for a clean run.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </MemoryRouter>,
    )
    // The calm "error" screen (WakingState variant="error") rendered — the
    // tree is NOT blank.
    expect(container).not.toBeEmptyDOMElement()
    expect(screen.getByText(/couldn't load this/i)).toBeInTheDocument()
  })

  it('renders children untouched when they do not throw', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <p>healthy content</p>
        </ErrorBoundary>
      </MemoryRouter>,
    )
    expect(screen.getByText('healthy content')).toBeInTheDocument()
  })
})
