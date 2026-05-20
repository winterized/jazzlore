import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import type { Action } from '../state/metronomeReducer'

function fireKey(opts: { key?: string; code?: string; shiftKey?: boolean; repeat?: boolean }) {
  const ev = new KeyboardEvent('keydown', {
    key: opts.key ?? '',
    code: opts.code,
    shiftKey: !!opts.shiftKey,
    repeat: !!opts.repeat,
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(ev)
}

function setup() {
  const onToggleStartStop = vi.fn()
  const onTap = vi.fn()
  const dispatch = vi.fn<(a: Action) => void>()
  const { unmount } = renderHook(() =>
    useKeyboardShortcuts({ onToggleStartStop, onTap, dispatch }),
  )
  return { onToggleStartStop, onTap, dispatch, unmount }
}

describe('useKeyboardShortcuts', () => {
  it('space toggles start/stop', () => {
    const { onToggleStartStop, unmount } = setup()
    fireKey({ code: 'Space' })
    expect(onToggleStartStop).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('ignores auto-repeat on space (one toggle per press)', () => {
    const { onToggleStartStop, unmount } = setup()
    fireKey({ code: 'Space' })
    fireKey({ code: 'Space', repeat: true })
    fireKey({ code: 'Space', repeat: true })
    expect(onToggleStartStop).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('T fires onTap', () => {
    const { onTap, unmount } = setup()
    fireKey({ key: 't' })
    expect(onTap).toHaveBeenCalledTimes(1)
    fireKey({ key: 'T' }) // shift-typed
    expect(onTap).toHaveBeenCalledTimes(2)
    unmount()
  })

  it('arrow keys nudge ±1', () => {
    const { dispatch, unmount } = setup()
    fireKey({ key: 'ArrowLeft' })
    fireKey({ key: 'ArrowRight' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'NUDGE_BPM', delta: -1 })
    expect(dispatch).toHaveBeenCalledWith({ type: 'NUDGE_BPM', delta: 1 })
    unmount()
  })

  it('shift + arrows nudge ±10', () => {
    const { dispatch, unmount } = setup()
    fireKey({ key: 'ArrowLeft', shiftKey: true })
    fireKey({ key: 'ArrowRight', shiftKey: true })
    expect(dispatch).toHaveBeenCalledWith({ type: 'NUDGE_BPM', delta: -10 })
    expect(dispatch).toHaveBeenCalledWith({ type: 'NUDGE_BPM', delta: 10 })
    unmount()
  })

  it('[ and ] dispatch classic-step', () => {
    const { dispatch, unmount } = setup()
    fireKey({ key: '[' })
    fireKey({ key: ']' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLASSIC_STEP', dir: 'prev' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLASSIC_STEP', dir: 'next' })
    unmount()
  })

  it('digits 2..7 set beats; 1 and 8 ignored', () => {
    const { dispatch, unmount } = setup()
    fireKey({ key: '1' })
    fireKey({ key: '2' })
    fireKey({ key: '7' })
    fireKey({ key: '8' })
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_BEATS', beats: 2 })
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_BEATS', beats: 7 })
    unmount()
  })

  it('no-op when focus is in an INPUT', () => {
    const { onToggleStartStop, dispatch, unmount } = setup()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    // dispatchEvent with target set via Object.defineProperty since we want
    // event.target.tagName to read 'INPUT'.
    const ev = new KeyboardEvent('keydown', {
      code: 'Space',
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(ev, 'target', { value: input, configurable: true })
    window.dispatchEvent(ev)

    fireKey({ key: 'ArrowLeft' })
    // The Space event was suppressed because target is INPUT. The ArrowLeft
    // event has target=document.body (the actual focused element by
    // dispatchEvent default) — that one passes through.
    expect(onToggleStartStop).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledTimes(1)

    input.remove()
    unmount()
  })

  it('removes the listener on unmount', () => {
    const { onTap, unmount } = setup()
    unmount()
    fireKey({ key: 't' })
    expect(onTap).not.toHaveBeenCalled()
  })
})
