// useBodyScrollLock — cancels background scroll gestures (wheel + touchmove)
// while a sheet is open, while leaving the sheet's own scrollable body
// (`.more-body`) free. Layout-preserving (no position:fixed / overflow) so
// the sticky page header doesn't jump.

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useBodyScrollLock } from './useBodyScrollLock'

function Harness({ active }: { active: boolean }) {
  useBodyScrollLock(active)
  return (
    <div>
      <div className="more-body">
        <span data-testid="inside">list row</span>
      </div>
      <div data-testid="outside">background</div>
    </div>
  )
}

function fireScroll(el: Element, type: 'wheel' | 'touchmove'): boolean {
  const ev = new Event(type, { bubbles: true, cancelable: true })
  el.dispatchEvent(ev)
  return ev.defaultPrevented
}

describe('useBodyScrollLock', () => {
  it('cancels background wheel + touchmove while active', () => {
    render(<Harness active />)
    const bg = screen.getByTestId('outside')
    expect(fireScroll(bg, 'wheel')).toBe(true)
    expect(fireScroll(bg, 'touchmove')).toBe(true)
  })

  it('leaves a SCROLLABLE sheet body free to scroll', () => {
    render(<Harness active />)
    const body = document.querySelector('.more-body') as HTMLElement
    // jsdom has no layout, so fake an overflowing scroll container.
    Object.defineProperty(body, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(body, 'clientHeight', { value: 200, configurable: true })
    const inside = screen.getByTestId('inside')
    expect(fireScroll(inside, 'wheel')).toBe(false)
    expect(fireScroll(inside, 'touchmove')).toBe(false)
  })

  it('cancels scroll inside a body whose content FITS (would otherwise chain to the page)', () => {
    render(<Harness active />)
    // Default jsdom: scrollHeight === clientHeight === 0 → not scrollable.
    const inside = screen.getByTestId('inside')
    expect(fireScroll(inside, 'touchmove')).toBe(true)
  })

  it('does nothing while inactive', () => {
    render(<Harness active={false} />)
    expect(fireScroll(screen.getByTestId('outside'), 'wheel')).toBe(false)
  })

  it('stops cancelling once unmounted (listeners removed)', () => {
    const { unmount } = render(<Harness active />)
    const bg = screen.getByTestId('outside')
    expect(fireScroll(bg, 'wheel')).toBe(true)
    unmount()
    expect(fireScroll(document.body, 'wheel')).toBe(false)
  })
})
