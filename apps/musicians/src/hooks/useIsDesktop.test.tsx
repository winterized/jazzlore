import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { useIsDesktop } from './useIsDesktop'

function Probe() {
  return <div data-testid="v">{useIsDesktop() ? 'desktop' : 'mobile'}</div>
}

type Listener = (e: MediaQueryListEvent) => void

/** A controllable matchMedia stub: returns `matches` and lets the test fire
 * a `change` so the hook's reactivity is exercised. */
function stubMatchMedia(initial: boolean) {
  let listener: Listener | null = null
  const mql = {
    matches: initial,
    media: '(min-width: 1024px)',
    addEventListener: (_: string, l: Listener) => {
      listener = l
    },
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }
  vi.stubGlobal('matchMedia', () => mql)
  return {
    fire(matches: boolean) {
      mql.matches = matches
      listener?.({ matches } as MediaQueryListEvent)
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('useIsDesktop', () => {
  it('defaults to mobile when matchMedia is unavailable (jsdom / SSR)', () => {
    render(<Probe />)
    expect(screen.getByTestId('v')).toHaveTextContent('mobile')
  })

  it('reports desktop at ≥1024px', () => {
    stubMatchMedia(true)
    render(<Probe />)
    expect(screen.getByTestId('v')).toHaveTextContent('desktop')
  })

  it('reacts to a viewport crossing the breakpoint', () => {
    const mq = stubMatchMedia(false)
    render(<Probe />)
    expect(screen.getByTestId('v')).toHaveTextContent('mobile')
    act(() => mq.fire(true))
    expect(screen.getByTestId('v')).toHaveTextContent('desktop')
  })
})
