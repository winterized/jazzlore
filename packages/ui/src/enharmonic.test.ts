import { describe, expect, it } from 'vitest'
import type { RootOption } from './RootPicker'
import { resolveDisplayed, resolveAlternateLabel } from './enharmonic'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const C: RootOption = { value: 'C', label: 'C' }
const Db: RootOption = { value: 'Db', label: 'D♭', alternate: { value: 'C#', label: 'C♯' } }
const Fs: RootOption = { value: 'F#', label: 'F♯', alternate: { value: 'Gb', label: 'G♭' } }

// ─── resolveDisplayed ─────────────────────────────────────────────────────────

describe('resolveDisplayed', () => {
  it('returns primary value+label when not flipped', () => {
    expect(resolveDisplayed(Db, false)).toEqual({ value: 'Db', label: 'D♭' })
  })

  it('returns alternate value+label when flipped', () => {
    expect(resolveDisplayed(Db, true)).toEqual({ value: 'C#', label: 'C♯' })
  })

  it('flip is a no-op when the option has no alternate', () => {
    expect(resolveDisplayed(C, false)).toEqual({ value: 'C', label: 'C' })
    expect(resolveDisplayed(C, true)).toEqual({ value: 'C', label: 'C' })
  })

  it('flip round-trips: false → true → false gives primary again', () => {
    const primary = resolveDisplayed(Fs, false)
    const flipped = resolveDisplayed(Fs, true)
    expect(primary).toEqual({ value: 'F#', label: 'F♯' })
    expect(flipped).toEqual({ value: 'Gb', label: 'G♭' })
  })
})

// ─── resolveAlternateLabel ────────────────────────────────────────────────────

describe('resolveAlternateLabel', () => {
  it('returns undefined when option has no alternate', () => {
    expect(resolveAlternateLabel(C, false)).toBeUndefined()
    expect(resolveAlternateLabel(C, true)).toBeUndefined()
  })

  it('returns the alternate label (what the badge switches TO) when not flipped', () => {
    // Badge shows "C♯" because clicking it would switch TO C♯
    expect(resolveAlternateLabel(Db, false)).toBe('C♯')
  })

  it('returns the primary label when flipped (badge switches back TO D♭)', () => {
    expect(resolveAlternateLabel(Db, true)).toBe('D♭')
  })

  it('works symmetrically for F♯/G♭', () => {
    expect(resolveAlternateLabel(Fs, false)).toBe('G♭')
    expect(resolveAlternateLabel(Fs, true)).toBe('F♯')
  })
})

// ─── Independence of flip state per option ────────────────────────────────────

describe('resolveDisplayed — per-option independence', () => {
  it('flipping one option does not affect others (pure function, caller manages state)', () => {
    // Both initially unflipped
    expect(resolveDisplayed(Db, false)).toEqual({ value: 'Db', label: 'D♭' })
    expect(resolveDisplayed(Fs, false)).toEqual({ value: 'F#', label: 'F♯' })

    // Flip only Db
    expect(resolveDisplayed(Db, true)).toEqual({ value: 'C#', label: 'C♯' })
    // Fs is unaffected (its state is still false)
    expect(resolveDisplayed(Fs, false)).toEqual({ value: 'F#', label: 'F♯' })
  })
})
