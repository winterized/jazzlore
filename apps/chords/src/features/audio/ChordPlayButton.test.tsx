/**
 * ChordPlayButton — unit tests.
 *
 * Strategy: mock @jazzlore/music-core so Tone.js is never loaded in jsdom.
 * The mock replaces playChord and unlockAudio with vi.fn() stubs.
 */

import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock @jazzlore/music-core ──────────────────────────────────────────────
// vi.mock is hoisted to the top of the file by Vitest, so variables defined
// at module scope are not yet initialised when the factory runs.
// vi.hoisted() lifts the factory call into the same hoisted position so the
// mock references resolve correctly.
const { mockPlayChord, mockUnlockAudio, mockStopAll } = vi.hoisted(() => ({
  mockPlayChord: vi.fn().mockResolvedValue(undefined),
  mockUnlockAudio: vi.fn().mockResolvedValue(undefined),
  mockStopAll: vi.fn(),
}))

vi.mock('@jazzlore/music-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@jazzlore/music-core')>()
  return {
    ...actual,
    playChord: mockPlayChord,
    unlockAudio: mockUnlockAudio,
    stopAll: mockStopAll,
  }
})

// Import after mocks are set up
import ChordPlayButton from './ChordPlayButton'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Render a standard Cmaj7 play button (ASCII-clean notes for simplicity). */
function renderCmaj7() {
  return render(<ChordPlayButton primary="Cmaj7" notes={['C', 'E', 'G', 'B']} />)
}

/** Render a B♭m7 play button (Unicode accidentals — the normalisation case). */
function renderBbm7() {
  return render(<ChordPlayButton primary="B♭m7" notes={['B♭', 'D♭', 'F', 'A♭']} />)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ChordPlayButton — rendering', () => {
  it('renders a button with aria-label containing the primary symbol', () => {
    renderCmaj7()
    expect(screen.getByRole('button', { name: /Play Cmaj7/i })).toBeInTheDocument()
  })

  it('is never disabled — tap-to-restart relies on playChord.stopAll semantics', () => {
    renderCmaj7()
    expect(screen.getByRole('button', { name: /Play Cmaj7/i })).not.toBeDisabled()
  })

  it('has aria-busy="false" when idle', () => {
    renderCmaj7()
    expect(screen.getByRole('button', { name: /Play Cmaj7/i })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })
})

describe('ChordPlayButton — click triggers playChord', () => {
  beforeEach(() => {
    mockPlayChord.mockClear()
    mockUnlockAudio.mockClear()
    mockStopAll.mockClear()
  })

  it('calls playChord with ASCII-octaved notes on click (pure ASCII root)', async () => {
    renderCmaj7()
    await userEvent.click(screen.getByRole('button', { name: /Play Cmaj7/i }))
    // withOctaves(['C','E','G','B'], 4) → ['C4','E4','G4','B4'] (all already ASCII)
    expect(mockPlayChord).toHaveBeenCalledOnce()
    expect(mockPlayChord).toHaveBeenCalledWith(['C4', 'E4', 'G4', 'B4'])
  })

  it('normalises Unicode accidentals to ASCII before calling playChord', async () => {
    renderBbm7()
    await userEvent.click(screen.getByRole('button', { name: /Play B♭m7/i }))
    // withOctaves(['B♭','D♭','F','A♭'], 4) → ['B♭4','D♭5','F5','A♭5']
    // then ♭ → b:                           ['Bb4', 'Db5','F5','Ab5']
    expect(mockPlayChord).toHaveBeenCalledOnce()
    expect(mockPlayChord).toHaveBeenCalledWith(['Bb4', 'Db5', 'F5', 'Ab5'])
  })

  it('calls unlockAudio before playChord on click', async () => {
    renderCmaj7()
    await userEvent.click(screen.getByRole('button', { name: /Play Cmaj7/i }))
    const unlockOrder = mockUnlockAudio.mock.invocationCallOrder[0] ?? 0
    const playOrder = mockPlayChord.mock.invocationCallOrder[0] ?? 0
    expect(unlockOrder).toBeLessThan(playOrder)
  })
})

describe('ChordPlayButton — in-flight state', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    mockPlayChord.mockClear()
    mockUnlockAudio.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flags aria-busy=true while playChord is resolving, false after auto-release', async () => {
    // playChord stays pending until we manually resolve it
    let resolvePlay!: () => void
    mockPlayChord.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePlay = resolve
      }),
    )
    // unlockAudio must resolve immediately so the onClick handler reaches playChord
    mockUnlockAudio.mockResolvedValue(undefined)

    renderCmaj7()
    const btn = screen.getByRole('button', { name: /Play Cmaj7/i })

    // Click fires async handler
    fireEvent.click(btn)

    // Flush microtasks up to (but not past) the pending playChord promise
    await act(async () => {
      await Promise.resolve()
    })

    // Button stays clickable (tap-to-restart) but signals in-flight via aria-busy
    expect(btn).not.toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')

    // Resolve playChord, let the finally block run, then advance the auto-release timer
    await act(async () => {
      resolvePlay()
    })
    await act(async () => {
      vi.advanceTimersByTime(3600)
    })

    expect(btn).toHaveAttribute('aria-busy', 'false')
  })

  it('shows "…" icon while playing and "▶" icon when idle', async () => {
    let resolvePlay!: () => void
    mockPlayChord.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePlay = resolve
      }),
    )
    mockUnlockAudio.mockResolvedValue(undefined)

    renderCmaj7()
    const btn = screen.getByRole('button', { name: /Play Cmaj7/i })

    // Idle: shows ▶ (play affordance, not a music note)
    expect(btn).toHaveTextContent('▶')
    expect(btn).not.toHaveTextContent('♪')

    fireEvent.click(btn)
    await act(async () => {
      await Promise.resolve()
    })

    // Playing: shows …
    expect(btn).toHaveTextContent('…')

    await act(async () => {
      resolvePlay()
    })
    await act(async () => {
      vi.advanceTimersByTime(3600)
    })

    // Back to idle: shows ▶
    expect(btn).toHaveTextContent('▶')
  })
})

describe('ChordPlayButton — auto-release timer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    mockPlayChord.mockClear()
    mockUnlockAudio.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns to idle after the auto-release timer fires (real playChord resolves immediately)', async () => {
    // playChord resolves immediately (scheduling is done), button stays pressed
    // until the 3500 ms auto-release fires
    mockPlayChord.mockResolvedValue(undefined)
    mockUnlockAudio.mockResolvedValue(undefined)

    renderCmaj7()
    const btn = screen.getByRole('button', { name: /Play Cmaj7/i })

    // fireEvent is synchronous; wrap in act + flush microtasks so the async
    // onClick handler (unlockAudio → playChord → finally) runs to completion.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(btn)
      // Three Promise.resolve() calls drain the three await points in onClick:
      //   1. await unlockAudio()
      //   2. await playChord()
      //   3. finally block sets the setTimeout
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    // Scheduling is done; the auto-release timer has been set but not fired.
    expect(btn).toHaveAttribute('aria-busy', 'true')

    // Advance past the 3500 ms auto-release
    await act(async () => {
      vi.advanceTimersByTime(3600)
    })

    expect(btn).toHaveAttribute('aria-busy', 'false')
  })
})

describe('ChordPlayButton — re-entrancy', () => {
  beforeEach(() => {
    mockPlayChord.mockClear()
    mockUnlockAudio.mockClear()
  })

  it('a rapid second click triggers a second playChord (tap-to-restart, playChord handles stopAll)', async () => {
    // First call stays in flight; second will be triggered before first resolves
    mockPlayChord.mockReturnValue(new Promise<void>(() => undefined))
    mockUnlockAudio.mockResolvedValue(undefined)

    renderCmaj7()
    const btn = screen.getByRole('button', { name: /Play Cmaj7/i })

    // First click
    fireEvent.click(btn)
    await act(async () => {
      await Promise.resolve()
    })

    // Button is NOT disabled — re-clickable. playChord's internal stopAll cuts the
    // first chord off when the second one schedules.
    expect(btn).not.toBeDisabled()

    // Second click while first is still in flight
    fireEvent.click(btn)
    await act(async () => {
      await Promise.resolve()
    })

    expect(mockPlayChord).toHaveBeenCalledTimes(2)
  })
})
