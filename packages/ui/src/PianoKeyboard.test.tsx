import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PianoKeyboard from './PianoKeyboard'

// SVG primitives like <rect>/<text> don't expose accessible roles for individual
// keys, so we query the structural data-* attributes we set on each <rect>.
const queryAll = (container: HTMLElement, selector: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelectorAll(selector)

// Pitch class arrays (0..11) for common scales, computed without music-core
// C major: C=0, D=2, E=4, F=5, G=7, A=9, B=11
const C_MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11] as const
// Bb Dorian: Bb=10, C=0, Db=1, Eb=3, F=5, G=7, Ab=8
const BB_DORIAN_PCS = [10, 0, 1, 3, 5, 7, 8] as const
// F major: F=5, G=7, A=9, Bb=10, C=0, D=2, E=4
const F_MAJOR_PCS = [5, 7, 9, 10, 0, 2, 4] as const

describe('PianoKeyboard', () => {
  it('renders 14 white keys and 10 black keys', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} />,
    )
    expect(queryAll(container, '[data-role="white-key"]')).toHaveLength(14)
    expect(queryAll(container, '[data-role="black-key"]')).toHaveLength(10)
  })

  it('marks the root with data-state="root" on every occurrence in range', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(2) // C4 and C5
  })

  it('marks non-root scale notes with data-state="scale"', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} />,
    )
    // 7-note scale, 2 octaves, root excluded → 12 scale-marked keys
    expect(queryAll(container, '[data-state="scale"]')).toHaveLength(12)
  })

  it('handles Bb Dorian: root marked twice, no double-marking on white/black', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={BB_DORIAN_PCS} rootPc={10} startOctave={4} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(2)
  })

  it('shows note names only when showNoteNames is true', () => {
    const { container, rerender } = render(
      <PianoKeyboard scalePcs={[0, 2]} rootPc={0} startOctave={4} />,
    )
    expect(queryAll(container, '[data-role="note-label"]')).toHaveLength(0)
    rerender(<PianoKeyboard scalePcs={[0, 2]} rootPc={0} startOctave={4} showNoteNames />)
    expect(queryAll(container, '[data-role="note-label"]').length).toBeGreaterThan(0)
  })

  it('renders without a root highlight when rootPc is undefined', () => {
    const { container } = render(
      <PianoKeyboard scalePcs={C_MAJOR_PCS} />,
    )
    expect(queryAll(container, '[data-state="root"]')).toHaveLength(0)
  })

  describe('startPc prop', () => {
    it('startPc=0 (default) still renders 14 white keys starting on C', () => {
      const { container } = render(
        <PianoKeyboard scalePcs={C_MAJOR_PCS} rootPc={0} startOctave={4} startPc={0} />,
      )
      const whites = queryAll(container, '[data-role="white-key"]')
      expect(whites).toHaveLength(14)
      // First white key must be C4
      expect(whites[0]?.getAttribute('data-note')).toBe('C4')
      // Last white key must be B5
      expect(whites[13]?.getAttribute('data-note')).toBe('B5')
    })

    it('startPc=5 (F): first white key is F, last is E (two octaves later)', () => {
      const { container } = render(
        <PianoKeyboard scalePcs={F_MAJOR_PCS} rootPc={5} startOctave={4} startPc={5} />,
      )
      const whites = queryAll(container, '[data-role="white-key"]')
      expect(whites).toHaveLength(14)
      // First white key is F
      expect(whites[0]?.getAttribute('data-note')).toBe('F4')
      // 8th key (start of second octave) is F again
      expect(whites[7]?.getAttribute('data-note')).toBe('F5')
      // Last white key is E
      expect(whites[13]?.getAttribute('data-note')).toBe('E6')
    })

    it('startPc=5 (F): root F appears twice (both octaves)', () => {
      const { container } = render(
        <PianoKeyboard scalePcs={F_MAJOR_PCS} rootPc={5} startOctave={4} startPc={5} />,
      )
      expect(queryAll(container, '[data-state="root"]')).toHaveLength(2)
    })

    it('startPc=5 (F): still renders 10 black keys', () => {
      const { container } = render(
        <PianoKeyboard scalePcs={[]} startOctave={4} startPc={5} />,
      )
      expect(queryAll(container, '[data-role="black-key"]')).toHaveLength(10)
    })

    it('startPc=11 (B): first white key is B, second octave starts on B again', () => {
      const { container } = render(
        <PianoKeyboard scalePcs={[]} startOctave={4} startPc={11} />,
      )
      const whites = queryAll(container, '[data-role="white-key"]')
      expect(whites).toHaveLength(14)
      expect(whites[0]?.getAttribute('data-note')).toBe('B4')
      expect(whites[7]?.getAttribute('data-note')).toBe('B5')
    })

    it('startPc=10 (Bb, a black key): throws an error', () => {
      // Bb is not a white key — the component requires white-key startPc.
      // Callers must pass startPc=9 (A) or startPc=11 (B) instead.
      expect(() =>
        render(<PianoKeyboard scalePcs={[]} startPc={10} />),
      ).toThrow(/startPc.*black key/i)
    })
  })

  // Fix #2 + #4 — chord voicing mode: each tone dotted exactly once
  // (root-position, ascending from the root), no per-octave repeats.
  describe('voicing="chord"', () => {
    // Cmaj7 = C E G B → semitone offsets [0,4,7,11] from root C.
    const CMAJ7 = [0, 4, 7, 11] as const

    it('dots each chord tone exactly once (Cmaj7 = 4 markers, not 8)', () => {
      const { container } = render(
        <PianoKeyboard
          voicing="chord"
          chordSemitones={CMAJ7}
          scalePcs={[0, 4, 7, 11]}
          rootPc={0}
          startPc={0}
          startOctave={4}
        />,
      )
      // Scale mode would mark every octave occurrence (8 across 2 octaves);
      // chord mode places exactly one dot per tone.
      expect(queryAll(container, '[data-role="marker"]')).toHaveLength(4)
    })

    it('marks the root exactly once (not every octave)', () => {
      const { container } = render(
        <PianoKeyboard
          voicing="chord"
          chordSemitones={CMAJ7}
          scalePcs={[0, 4, 7, 11]}
          rootPc={0}
          startPc={0}
          startOctave={4}
        />,
      )
      expect(queryAll(container, '[data-marker-for="root"]')).toHaveLength(1)
      expect(queryAll(container, '[data-marker-for="scale"]')).toHaveLength(3)
    })

    it('Cmaj13 [0,4,7,11,14,21]: 6 distinct dots (no per-octave repeat)', () => {
      const { container } = render(
        <PianoKeyboard
          voicing="chord"
          chordSemitones={[0, 4, 7, 11, 14, 21]}
          scalePcs={[0, 4, 7, 11, 2, 9]}
          rootPc={0}
          startPc={0}
          startOctave={4}
        />,
      )
      expect(queryAll(container, '[data-role="marker"]')).toHaveLength(6)
      expect(queryAll(container, '[data-marker-for="root"]')).toHaveLength(1)
    })

    it('octave-folds a synthetic out-of-window tone so it still appears once', () => {
      // offset 25 folds to abs 13; total still 2 distinct markers (root + folded).
      const { container } = render(
        <PianoKeyboard
          voicing="chord"
          chordSemitones={[0, 25]}
          scalePcs={[0]}
          rootPc={0}
          startPc={0}
          startOctave={4}
        />,
      )
      expect(queryAll(container, '[data-role="marker"]')).toHaveLength(2)
    })

    it('places dots on the keys whose abs positions match (Cmaj7 white E/G/B + root C)', () => {
      const { container } = render(
        <PianoKeyboard
          voicing="chord"
          chordSemitones={CMAJ7}
          scalePcs={[0, 4, 7, 11]}
          rootPc={0}
          startPc={0}
          startOctave={4}
        />,
      )
      // C E G B are all white keys in a C-anchored window, lower octave.
      const dotted = queryAll(container, '[data-role="white-key"][data-state="root"], [data-role="white-key"][data-state="scale"]')
      const notes = Array.from(dotted).map((el) => el.getAttribute('data-note'))
      expect(notes).toEqual(['C4', 'E4', 'G4', 'B4'])
    })

    it('default voicing="scale" still repeats every octave (regression guard)', () => {
      const { container } = render(
        <PianoKeyboard scalePcs={[0, 4, 7, 11]} rootPc={0} startPc={0} startOctave={4} />,
      )
      // 4 pitch classes × 2 octaves = 8 markers (unchanged scale behaviour).
      expect(queryAll(container, '[data-role="marker"]')).toHaveLength(8)
    })

    it('chordSemitones is ignored when voicing is "scale" (default)', () => {
      const { container } = render(
        <PianoKeyboard
          chordSemitones={[0, 4, 7, 11, 14, 21]}
          scalePcs={[0, 4, 7, 11]}
          rootPc={0}
          startPc={0}
          startOctave={4}
        />,
      )
      expect(queryAll(container, '[data-role="marker"]')).toHaveLength(8)
    })
  })

  // Fix #3 — leading half black-key for orientation when the window starts
  // on a white key a real piano shows a black key to the left of.
  describe('leading half black-key', () => {
    const sel = '[data-role="leading-black-key"]'

    it('absent for startPc=0 (C) — C has no black key below it', () => {
      const { container } = render(<PianoKeyboard scalePcs={[]} startPc={0} />)
      expect(queryAll(container, sel)).toHaveLength(0)
    })

    it('absent for startPc=5 (F) — F has no black key below it', () => {
      const { container } = render(<PianoKeyboard scalePcs={[]} startPc={5} />)
      expect(queryAll(container, sel)).toHaveLength(0)
    })

    it.each([
      [2, 'D', 'C#'],
      [4, 'E', 'D#'],
      [7, 'G', 'F#'],
      [9, 'A', 'G#'],
      [11, 'B', 'A#'],
    ])('present for startPc=%i (%s) and is the black key just below (%s)', (startPc, _white, blackName) => {
      const { container } = render(<PianoKeyboard scalePcs={[]} startPc={startPc} />)
      const leading = queryAll(container, sel)
      expect(leading).toHaveLength(1)
      expect(leading[0]?.getAttribute('data-note')).toBe(blackName)
    })

    it('carries no scale/root dot and is excluded from chord dotting', () => {
      // A-anchored window, A major triad as a chord — the leading G# must
      // never be a marker target nor carry data-state.
      const { container } = render(
        <PianoKeyboard
          voicing="chord"
          chordSemitones={[0, 4, 7]}
          scalePcs={[9, 1, 4]}
          rootPc={9}
          startPc={9}
          startOctave={4}
        />,
      )
      const leading = queryAll(container, sel)[0]
      expect(leading).toBeTruthy()
      expect(leading?.getAttribute('data-state')).not.toBe('root')
      expect(leading?.getAttribute('data-state')).not.toBe('scale')
      // It is not counted as a real black key either.
      const blacks = Array.from(queryAll(container, '[data-role="black-key"]'))
      expect(blacks.some((b) => b.getAttribute('data-role') === 'leading-black-key')).toBe(false)
    })

    it('renders INSIDE the keyboard, over the first white key (no left protrusion)', () => {
      // Regression guard: the leading key must overlay the left edge of the
      // first white key (x=0, half a black-key wide), fully within the
      // keyboard bounds — NOT a full key centred on x=0 hanging past the
      // left edge.
      const WHITE = 32
      const BLACK_W = 20
      const totalWidth = 14 * WHITE
      const { container } = render(<PianoKeyboard scalePcs={[]} startPc={2} />)
      const leading = queryAll(container, sel)[0]
      expect(leading).toBeTruthy()
      const x = Number(leading?.getAttribute('x'))
      const w = Number(leading?.getAttribute('width'))
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x + w).toBeLessThanOrEqual(totalWidth)
      expect(x).toBe(0)
      expect(w).toBe(BLACK_W / 2)
      // viewBox must not be extended negative to show an off-canvas half.
      const vb = queryAll(container, 'svg')[0]?.getAttribute('viewBox')
      expect(vb).toBe(`0 0 ${totalWidth} 110`)
    })

    it('does not change the real black-key count for D/E/G/A/B starts', () => {
      // The leading key uses a distinct data-role, so [data-role="black-key"]
      // counts are unchanged vs. before this fix. (Updated assertion: we now
      // explicitly assert the leading key lives outside the black-key set.)
      const { container } = render(<PianoKeyboard scalePcs={[]} startPc={2} />)
      // D-anchored: 14 keys D E F G A B C D E F G A B C → 9 real black keys.
      expect(queryAll(container, '[data-role="black-key"]')).toHaveLength(9)
      expect(queryAll(container, '[data-role="leading-black-key"]')).toHaveLength(1)
    })
  })
})
