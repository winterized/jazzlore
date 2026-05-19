import { render, screen, act, fireEvent } from '@testing-library/react'
import { useRef, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMosaicScrollPulse } from './useMosaicScrollPulse'

// jsdom has neither IntersectionObserver nor scrollIntoView nor (reliable)
// matchMedia (project tooling quirk). We install controllable mocks so the
// pulse-on-scroll-LAND timing (landmine 7) and the reduced-motion path
// (single frame, instant scroll) are both deterministically asserted.

// The hook only reads `entry.isIntersecting`; `target` is intentionally
// omitted so the test never has to pass a queried DOM node into the mocked
// observer (keeps testing-library/no-node-access clean).
type IOEntry = { isIntersecting: boolean }
let ioInstances: Array<{
  cb: (entries: IOEntry[]) => void
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}>

function installIO(): void {
  ioInstances = []
  class FakeIO {
    cb: (entries: IOEntry[]) => void
    observe = vi.fn()
    disconnect = vi.fn()
    constructor(cb: (entries: IOEntry[]) => void) {
      this.cb = cb
      ioInstances.push(this)
    }
    unobserve = vi.fn()
    takeRecords = (): IOEntry[] => []
    root = null
    rootMargin = ''
    thresholds = []
  }
  vi.stubGlobal('IntersectionObserver', FakeIO)
}

function setMatchMedia(reduced: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (q: string) => ({
      matches: reduced && q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }),
  )
}

const scrollSpy = vi.fn()

function Harness() {
  const railRef = useRef<HTMLDivElement>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const onTap = useMosaicScrollPulse(railRef, setPulseId)
  return (
    <div>
      <button onClick={() => onTap('c1')}>tap c1</button>
      <div ref={railRef}>
        <div data-collab-id="c1" data-pulse={pulseId === 'c1' ? 'on' : 'off'}>
          row 1
        </div>
      </div>
    </div>
  )
}

beforeEach(() => {
  installIO()
  Element.prototype.scrollIntoView = scrollSpy
  scrollSpy.mockClear()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMosaicScrollPulse — pulse on scroll-LAND (default motion)', () => {
  beforeEach(() => setMatchMedia(false))

  it('scrolls the matching row into centre (smooth) on tap', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('tap c1'))
    expect(scrollSpy).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    })
  })

  it('does NOT pulse on tap — only after the row intersects (lands)', () => {
    render(<Harness />)
    const row = screen.getByText('row 1')
    fireEvent.click(screen.getByText('tap c1'))
    // Tapped + scrolling, but the row has not landed yet.
    expect(row).toHaveAttribute('data-pulse', 'off')
    // IO fires when the row scrolls into view → NOW the pulse fires. The IO
    // callback updates state outside React's event system, so it needs act.
    act(() => {
      ioInstances[0]!.cb([{ isIntersecting: true }])
    })
    expect(row).toHaveAttribute('data-pulse', 'on')
  })

  it('observes the target row and disconnects after landing', () => {
    render(<Harness />)
    const row = screen.getByText('row 1')
    fireEvent.click(screen.getByText('tap c1'))
    const io = ioInstances[0]!
    expect(io.observe).toHaveBeenCalledWith(row)
    act(() => {
      io.cb([{ isIntersecting: true }])
    })
    expect(io.disconnect).toHaveBeenCalled()
  })
})

describe('useMosaicScrollPulse — reduced motion (instant, single frame)', () => {
  beforeEach(() => setMatchMedia(true))

  it('scrolls instantly (auto) and pulses immediately, no IntersectionObserver', () => {
    render(<Harness />)
    const row = screen.getByText('row 1')
    fireEvent.click(screen.getByText('tap c1'))
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' })
    expect(row).toHaveAttribute('data-pulse', 'on')
    expect(ioInstances).toHaveLength(0)
  })
})
