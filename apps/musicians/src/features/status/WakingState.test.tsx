import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { WakingState } from './WakingState'

const FALLBACK = [
  { id: 'wikidata:Q93341', name: 'Miles Davis' },
  { id: 'wikidata:Q7346', name: 'John Coltrane' },
  { id: 'wikidata:Q379938', name: 'Bobby Timmons' },
]

function setup(props: Partial<Parameters<typeof WakingState>[0]> = {}) {
  const onRetry = vi.fn()
  render(
    <MemoryRouter>
      <WakingState
        variant="waking"
        retryAfter={8}
        fallback={FALLBACK}
        onRetry={onRetry}
        {...props}
      />
    </MemoryRouter>,
  )
  return { onRetry }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
})
afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('WakingState', () => {
  it('renders the calm "waking" copy as a status region, not an error shout', () => {
    setup()
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /waking up/i }),
    ).toBeInTheDocument()
    // Calm, reassuring — nobody has gone anywhere.
    expect(screen.getByText(/still here/i)).toBeInTheDocument()
  })

  it('counts the retry timer down each second and re-fires onRetry at zero', () => {
    const { onRetry } = setup({ retryAfter: 3 })
    expect(screen.getByText(/retry in 3s/i)).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(1000))
    expect(screen.getByText(/retry in 2s/i)).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(2000))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('lets the user retry immediately via the button', () => {
    // fireEvent (not userEvent) because the suite runs on fake timers —
    // userEvent's internal inter-event delay never resolves and the test
    // would hang on a timer it owns. The click itself is synchronous.
    const { onRetry } = setup()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('offers the cached fallback names as real navigable links (never stranded)', () => {
    setup()
    const miles = screen.getByRole('link', { name: /miles davis/i })
    expect(miles).toHaveAttribute(
      'href',
      '/musicians/wikidata%3AQ93341',
    )
    expect(screen.getByRole('link', { name: /coltrane/i })).toBeInTheDocument()
  })

  it('hides the fallback block entirely when nothing is cached', () => {
    setup({ fallback: [] })
    expect(screen.queryByText(/read offline/i)).toBeNull()
  })

  it('error variant is a true alert with a "report" affordance', () => {
    setup({ variant: 'error', retryAfter: undefined })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /napping/i }),
    ).toBeInTheDocument()
    // No countdown when there is no retryAfter (a hard error, not a cold DB).
    expect(screen.queryByText(/retry in/i)).toBeNull()
  })
})
