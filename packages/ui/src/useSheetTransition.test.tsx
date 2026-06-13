// useSheetTransition — slides a sheet in on mount and OUT before unmount, so a
// conditionally-mounted sheet animates closed instead of vanishing.

import { render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSheetTransition } from './useSheetTransition'

function Harness({
  onClose,
  exitMs,
}: {
  onClose: () => void
  exitMs?: number
}) {
  const { open, requestClose } = useSheetTransition(onClose, exitMs)
  return (
    <button
      type="button"
      data-testid="sheet"
      data-open={open ? 'true' : 'false'}
      onClick={requestClose}
    >
      sheet
    </button>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSheetTransition', () => {
  it('flips open=true on the next frame (slide-in)', async () => {
    render(<Harness onClose={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true'),
    )
  })

  it('on requestClose: slides out immediately, defers onClose to the exit', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} exitMs={30} />)
    const el = await screen.findByTestId('sheet')
    await waitFor(() => expect(el).toHaveAttribute('data-open', 'true'))

    act(() => el.click())
    // Slide-out has started, but the unmount (onClose) is deferred.
    expect(el).toHaveAttribute('data-open', 'false')
    expect(onClose).not.toHaveBeenCalled()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('ignores a second requestClose (single onClose)', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} exitMs={20} />)
    const el = await screen.findByTestId('sheet')
    act(() => el.click())
    act(() => el.click())
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 40))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes immediately under prefers-reduced-motion (no exit delay)', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const onClose = vi.fn()
    render(<Harness onClose={onClose} exitMs={9999} />)
    const el = await screen.findByTestId('sheet')
    act(() => el.click())
    expect(onClose).toHaveBeenCalledTimes(1) // synchronous, not after 9999ms
  })
})
