// useTitle — unit tests for the document.title hook.
//
// jsdom carries a writable document.title, so the hook is straightforward to
// drive via renderHook. The default-title reset is asserted both via the
// explicit `null` path and via the unmount cleanup of a previously-set title.

import { renderHook } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { useTitle } from './useTitle'

describe('useTitle', () => {
  beforeEach(() => {
    document.title = 'Jazzlore — Jazz musicians'
  })

  it('sets document.title to the provided string', () => {
    renderHook(() => useTitle('Miles Davis — Jazzlore'))
    expect(document.title).toBe('Miles Davis — Jazzlore')
  })

  it('restores the previous title on unmount', () => {
    const { unmount } = renderHook(() => useTitle('Miles Davis — Jazzlore'))
    unmount()
    expect(document.title).toBe('Jazzlore — Jazz musicians')
  })

  it('resets to default when given null', () => {
    document.title = 'stale'
    renderHook(() => useTitle(null))
    expect(document.title).toBe('Jazzlore — Jazz musicians')
  })

  it('resets to default when given undefined', () => {
    document.title = 'stale'
    renderHook(() => useTitle(undefined))
    expect(document.title).toBe('Jazzlore — Jazz musicians')
  })

  it('reacts to title changes', () => {
    const { rerender } = renderHook(({ t }) => useTitle(t), {
      initialProps: { t: 'A — Jazzlore' },
    })
    expect(document.title).toBe('A — Jazzlore')
    rerender({ t: 'B — Jazzlore' })
    expect(document.title).toBe('B — Jazzlore')
  })
})
