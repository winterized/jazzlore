// useSheetDrag — the sheet follows the finger while dragging, then dismisses
// past the threshold or springs back below it.

import { render, screen, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useSheetDrag } from './useSheetDrag'

function Harness({
  onDismiss,
  ignoreClosest,
}: {
  onDismiss: () => void
  ignoreClosest?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const handlers = useSheetDrag(ref, { onDismiss, ignoreClosest })
  return (
    <div ref={ref} data-testid="sheet" {...handlers}>
      <div data-testid="handle">handle</div>
      <div className="more-body">
        <span data-testid="body">row</span>
      </div>
    </div>
  )
}

describe('useSheetDrag', () => {
  it('translates the sheet down to follow the finger', () => {
    render(<Harness onDismiss={vi.fn()} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(screen.getByTestId('handle'), {
      touches: [{ clientY: 100 }],
    })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] })
    expect(sheet.style.transform).toBe('translateY(60px)')
    // Upward drag never moves it above the open position.
    fireEvent.touchMove(sheet, { touches: [{ clientY: 40 }] })
    expect(sheet.style.transform).toBe('')
  })

  it('dismisses (continues off-screen) when dragged past the threshold', () => {
    const onDismiss = vi.fn()
    render(<Harness onDismiss={onDismiss} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(screen.getByTestId('handle'), {
      touches: [{ clientY: 100 }],
    })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 320 }] }) // 220px down
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 320 }] })
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(sheet.style.transform).toBe('translateY(110%)')
  })

  it('springs back (no dismiss) for a short drag', () => {
    const onDismiss = vi.fn()
    render(<Harness onDismiss={onDismiss} />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(screen.getByTestId('handle'), {
      touches: [{ clientY: 100 }],
    })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 120 }] }) // 20px
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 120 }] })
    expect(onDismiss).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe('translateY(0)')
  })

  it('ignores a drag that begins inside the scroll-gated body', () => {
    const onDismiss = vi.fn()
    render(<Harness onDismiss={onDismiss} ignoreClosest=".more-body" />)
    const sheet = screen.getByTestId('sheet')
    fireEvent.touchStart(screen.getByTestId('body'), {
      touches: [{ clientY: 100 }],
    })
    fireEvent.touchMove(sheet, { touches: [{ clientY: 320 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 320 }] })
    expect(onDismiss).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe('')
  })
})
