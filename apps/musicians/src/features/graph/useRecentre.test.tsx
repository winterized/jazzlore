import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import {
  NODE_FADE_MS,
  RECENTRE_MS,
  prefersReducedMotion,
  useRecentre,
} from './useRecentre'
import { computeLayout, type GraphLayout } from './layout'
import { BOBBY_LIKE } from './fixtures'

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(
      () =>
        ({
          matches,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          onchange: null,
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    ),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** Harness surfacing the current frame for assertions. */
function Harness({
  layout,
  onFrame,
}: {
  layout: GraphLayout
  onFrame: (f: ReturnType<typeof useRecentre>) => void
}) {
  onFrame(useRecentre(layout))
  return null
}

describe('prefersReducedMotion', () => {
  it('is false when matchMedia is absent (jsdom default)', () => {
    expect(prefersReducedMotion()).toBe(false)
  })
  it('reflects the media query when present', () => {
    stubReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
  })
})

describe('useRecentre — constants match the design motion spec', () => {
  it('900ms re-centre, 200ms new-node fade', () => {
    expect(RECENTRE_MS).toBe(900)
    expect(NODE_FADE_MS).toBe(200)
  })
})

describe('useRecentre — snap path (cold mount / reduced motion / no rAF)', () => {
  it('cold mount emits the final layout immediately, fade=1', () => {
    const next = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[0]!.id)
    let last: ReturnType<typeof useRecentre> | undefined
    render(<Harness layout={next} onFrame={(f) => (last = f)} />)
    const frame = last!
    expect(frame.nodes).toHaveLength(next.nodes.length)
    for (const n of frame.nodes) {
      expect(n.fade).toBe(1)
      const settled = next.nodes.find((s) => s.id === n.id)!
      expect(n.x).toBeCloseTo(settled.x, 6)
      expect(n.y).toBeCloseTo(settled.y, 6)
    }
  })

  it('re-centre with no rAF available snaps to the new layout', () => {
    // jsdom default: no requestAnimationFrame global → snap branch.
    const a = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[0]!.id)
    const b = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[2]!.id)
    let last: ReturnType<typeof useRecentre> | undefined
    const { rerender } = render(
      <Harness layout={a} onFrame={(f) => (last = f)} />,
    )
    rerender(<Harness layout={b} onFrame={(f) => (last = f)} />)
    const frame = last!
    for (const n of frame.nodes) {
      const settled = b.nodes.find((s) => s.id === n.id)!
      expect(n.x).toBeCloseTo(settled.x, 6)
      expect(n.y).toBeCloseTo(settled.y, 6)
    }
  })

  it('reduced-motion re-centre schedules no animation frame', () => {
    stubReducedMotion(true)
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)

    const a = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[0]!.id)
    const b = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[2]!.id)
    let last: ReturnType<typeof useRecentre> | undefined
    const { rerender } = render(
      <Harness layout={a} onFrame={(f) => (last = f)} />,
    )
    rerender(<Harness layout={b} onFrame={(f) => (last = f)} />)

    expect(raf).not.toHaveBeenCalled()
    const frame = last!
    for (const n of frame.nodes) {
      const settled = b.nodes.find((s) => s.id === n.id)!
      expect(n.x).toBeCloseTo(settled.x, 6)
      expect(n.y).toBeCloseTo(settled.y, 6)
    }
  })
})

describe('useRecentre — animated path schedules a frame', () => {
  it('schedules requestAnimationFrame when motion is allowed + rAF exists', () => {
    stubReducedMotion(false)
    const raf = vi.fn().mockReturnValue(1)
    vi.stubGlobal('requestAnimationFrame', raf)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const a = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[0]!.id)
    const b = computeLayout(BOBBY_LIKE, BOBBY_LIKE.nodes[3]!.id)
    const { rerender } = render(<Harness layout={a} onFrame={() => {}} />)
    // Cold mount must NOT animate (no origin yet).
    expect(raf).not.toHaveBeenCalled()
    rerender(<Harness layout={b} onFrame={() => {}} />)
    // The focus change has an origin → the tween schedules a frame.
    expect(raf).toHaveBeenCalledTimes(1)
  })
})
