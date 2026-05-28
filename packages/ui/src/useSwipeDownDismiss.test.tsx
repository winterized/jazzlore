// useSwipeDownDismiss — the shared swipe-down-to-dismiss gesture for mobile
// sheets. Extracted from the musicians MoreAboutSheet / SharedRecordsSheet
// duplication (issue #115). The optional `ignoreClosest` gate is what lets a
// scrollable sheet (SharedRecords) opt out of dismiss while a non-scrolling
// sheet (MoreAbout) keeps the gate off — both behaviours preserved exactly.

import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { describe, expect, it } from 'vitest'
import { useSwipeDownDismiss } from './useSwipeDownDismiss'

function Harness({
  onClose,
  ignoreClosest,
  thresholdPx,
}: {
  onClose: () => void
  ignoreClosest?: string
  thresholdPx?: number
}) {
  const swipe = useSwipeDownDismiss(onClose, { ignoreClosest, thresholdPx })
  return (
    <div data-testid="sheet" {...swipe}>
      <div data-testid="chrome">handle</div>
      <div className="scroll-body" data-testid="body">
        <button type="button" data-testid="row">
          row
        </button>
      </div>
    </div>
  )
}

describe('useSwipeDownDismiss', () => {
  it('dismisses on a downward swipe ≥ the default 80px threshold', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 200 }] }) // 100px
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('dismisses at exactly the threshold (locks the >= comparison)', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 180 }] }) // exactly 80px
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT dismiss on a short (< 80px) swipe', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 140 }] }) // 40px
    expect(onClose).not.toHaveBeenCalled()
  })

  it('with ignoreClosest, a touch starting inside the matched region does NOT dismiss', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} ignoreClosest=".scroll-body" />)
    const row = screen.getByTestId('row') // lives inside .scroll-body
    fireEvent.touchStart(row, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(row, { changedTouches: [{ clientY: 300 }] }) // 200px — a scroll, not a dismiss
    expect(onClose).not.toHaveBeenCalled()
  })

  it('with ignoreClosest, a touch starting on the chrome still dismisses', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} ignoreClosest=".scroll-body" />)
    const chrome = screen.getByTestId('chrome') // NOT inside .scroll-body
    fireEvent.touchStart(chrome, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(chrome, { changedTouches: [{ clientY: 200 }] }) // 100px
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('without ignoreClosest, a touch starting anywhere dismisses (the gate is opt-in)', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const row = screen.getByTestId('row')
    fireEvent.touchStart(row, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(row, { changedTouches: [{ clientY: 300 }] }) // 200px
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('respects a custom thresholdPx', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} thresholdPx={200} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 250 }] }) // 150px — below custom 200
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 320 }] }) // 220px — above custom 200
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
