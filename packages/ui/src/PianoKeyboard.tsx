import type { ReactNode } from 'react'
import {
  WHITE_PC_SET,
  deriveBlackKeySpecs,
  deriveLeadingBlackKeyName,
  deriveWhiteKeyAbsOffsets,
  deriveWhiteKeyNamesForOctave,
  deriveWhiteKeyPcsForOctave,
  resolveChordKeyPositions,
} from './pianoKeyboard.helpers'

/**
 * Props for PianoKeyboard.
 *
 * `startPc` — the pitch class (0-11) of the leftmost white key of the visible
 * 2-octave window. Defaults to 0 (C). **Must be a white-key pitch class**:
 * one of 0 (C), 2 (D), 4 (E), 5 (F), 7 (G), 9 (A), 11 (B).
 *
 * Passing a black-key pitch class (1, 3, 6, 8, 10) throws an error at render
 * time. This is intentional: the caller must explicitly choose which
 * neighbouring white key to anchor on, so intent is unambiguous when wiring
 * chord roots (Phase 6).
 *
 * `voicing` — `'scale'` (default) repeats the highlighted pitch-class pattern
 * every octave (correct for scales). `'chord'` places **each chord tone
 * exactly once**, ascending from the root in root position, using
 * `chordSemitones`; `scalePcs` is then ignored for highlighting.
 *
 * `chordSemitones` — root-relative semitone offsets in ascending stack order,
 * e.g. `[0, 4, 7, 11, 14, 21]` for a maj13. Element 0 (offset 0) is the root.
 * Only consulted when `voicing === 'chord'`.
 */
type Props = {
  rootPc?: number // 0..11; undefined = no root highlight (scale mode only)
  scalePcs: readonly number[] // 0..11; pitch classes of scale tones (scale mode)
  startOctave?: number // default 4 (only affects data-note attributes for tests)
  startPc?: number // default 0 (C); must be a white-key PC — see JSDoc above
  showNoteNames?: boolean // default false
  voicing?: 'scale' | 'chord' // default 'scale' — see JSDoc above
  chordSemitones?: readonly number[] // root-position offsets; chord mode only
}

type KeyState = 'root' | 'scale' | 'off'

const WHITE = 32
const BLACK_W = 20
const HEIGHT = 110
const BLACK_H = 70

const classFor = (kind: 'white' | 'black'): string =>
  kind === 'white' ? 'fill-white dark:fill-stone-100' : 'fill-stone-900 dark:fill-stone-950'

export default function PianoKeyboard({
  rootPc,
  scalePcs,
  startOctave = 4,
  startPc = 0,
  showNoteNames = false,
  voicing = 'scale',
  chordSemitones = [],
}: Props) {
  if (!WHITE_PC_SET.has(startPc)) {
    throw new Error(
      `startPc ${startPc} is a black key — pass a white-key pitch class (0 C, 2 D, 4 E, 5 F, 7 G, 9 A, 11 B)`,
    )
  }

  const octavePcs = deriveWhiteKeyPcsForOctave(startPc)
  const octaveNames = deriveWhiteKeyNamesForOctave(startPc)
  const blackSpecs = deriveBlackKeySpecs(octavePcs)
  const whiteAbs = deriveWhiteKeyAbsOffsets(octavePcs)

  const scalePcSet = new Set(scalePcs)
  const stateForPc = (pc: number): KeyState =>
    pc === rootPc ? 'root' : scalePcSet.has(pc) ? 'scale' : 'off'

  // Chord mode places each tone exactly once (root-position, ascending,
  // octave-folded) — keyed by absolute semitone position rather than pitch
  // class so a 13th's 9th lands at root+14, not root+2.
  const isChord = voicing === 'chord'
  const chordStateByAbs = new Map<number, KeyState>()
  if (isChord && rootPc !== undefined) {
    for (const { abs, role } of resolveChordKeyPositions(chordSemitones, rootPc, startPc)) {
      // First write wins per position: the root is listed first (offset 0).
      if (!chordStateByAbs.has(abs)) chordStateByAbs.set(abs, role)
    }
  }
  // `abs` is each key's absolute semitone offset from the leftmost white key.
  // Scale mode keeps its per-octave pitch-class behaviour untouched.
  const stateFor = (pc: number, abs: number): KeyState =>
    isChord ? (chordStateByAbs.get(abs) ?? 'off') : stateForPc(pc)

  const whites: ReactNode[] = []
  const blacks: ReactNode[] = []
  const markers: ReactNode[] = []
  const labels: ReactNode[] = []

  const pushMarker = (
    key: string,
    cx: number,
    cy: number,
    state: Exclude<KeyState, 'off'>,
    kind: 'white' | 'black',
  ) => {
    if (state === 'root') {
      markers.push(
        <circle
          key={key}
          data-role="marker"
          data-marker-for={state}
          cx={cx}
          cy={cy}
          r={6}
          className="fill-amber-500 stroke-white dark:stroke-stone-900"
          strokeWidth={1.5}
        />,
      )
      return
    }
    // Scale-tone marker: dark fill on white keys, light fill on black. Both
    // satisfy WCAG 1.4.11 non-text contrast (≥ 3:1).
    const scaleFill = kind === 'white' ? 'fill-stone-700' : 'fill-stone-200'
    markers.push(
      <circle
        key={key}
        data-role="marker"
        data-marker-for={state}
        cx={cx}
        cy={cy}
        r={4.5}
        className={scaleFill}
      />,
    )
  }

  // 2 octaves of white keys. Octave number increments on B→C crossings (pc=0
  // appearing after a non-zero pc), so F4 G4 A4 B4 C5 D5 E5 F5 … works for any
  // startPc, not just C.
  let currentOct = startOctave
  let prevPc = -1

  for (let i = 0; i < 14; i++) {
    const pcIndex = i % 7
    const pc = octavePcs[pcIndex]
    const letter = octaveNames[pcIndex]
    if (pc === undefined || letter === undefined) continue

    if (i > 0 && pc === 0 && prevPc !== 0) currentOct++
    const oct = currentOct
    prevPc = pc

    const state = stateFor(pc, whiteAbs[i] ?? -1)
    whites.push(
      <rect
        key={`w-${i}`}
        data-role="white-key"
        data-state={state}
        data-note={`${letter}${oct}`}
        x={i * WHITE}
        y={0}
        width={WHITE}
        height={HEIGHT}
        className={`${classFor('white')} stroke-stone-400`}
        strokeWidth={1}
      />,
    )
    if (state !== 'off') {
      pushMarker(`wm-${i}`, i * WHITE + WHITE / 2, HEIGHT - 14, state, 'white')
    }
    if (showNoteNames && state !== 'off') {
      labels.push(
        <text
          key={`l-${i}`}
          data-role="note-label"
          x={i * WHITE + WHITE / 2}
          y={HEIGHT - 28}
          textAnchor="middle"
          fontSize={10}
          className="fill-stone-900"
        >
          {letter}
        </text>,
      )
    }
  }

  for (const spec of blackSpecs) {
    // A black key sits one semitone above the white key it follows.
    const blackAbs = (whiteAbs[spec.globalWhiteIdx] ?? -2) + 1
    const state = stateFor(spec.pc, blackAbs)
    const x = (spec.globalWhiteIdx + 1) * WHITE - BLACK_W / 2
    blacks.push(
      <rect
        key={`b-${spec.globalWhiteIdx}`}
        data-role="black-key"
        data-state={state}
        data-note={spec.name}
        x={x}
        y={0}
        width={BLACK_W}
        height={BLACK_H}
        className={`${classFor('black')} stroke-stone-900`}
        strokeWidth={1}
      />,
    )
    if (state !== 'off') {
      pushMarker(`bm-${spec.globalWhiteIdx}`, x + BLACK_W / 2, BLACK_H - 10, state, 'black')
    }
  }

  // Decorative leading half black-key (Fix #3): when the window starts on a
  // white key a real piano shows a black key to the left of (D, E, G, A, B),
  // draw that key centred on x=0 so exactly half shows past the left edge.
  // Never a marker target, no data-state — purely for visual orientation.
  // Unconditional on caller: C/F windows (incl. all scales) get nothing.
  const leadingBlackName = deriveLeadingBlackKeyName(startPc)
  const leadingBlack =
    leadingBlackName !== null ? (
      <rect
        key="leading-black"
        data-role="leading-black-key"
        data-note={leadingBlackName}
        x={-BLACK_W / 2}
        y={0}
        width={BLACK_W}
        height={BLACK_H}
        className={`${classFor('black')} stroke-stone-900`}
        strokeWidth={1}
      />
    ) : null

  const totalWidth = 14 * WHITE
  // Shift the viewBox origin left by half a black key only when a leading key
  // is drawn, so the 14 real keys keep their exact positions and precisely
  // half the leading key is visible at the edge.
  const minX = leadingBlack !== null ? -BLACK_W / 2 : 0
  const viewWidth = totalWidth - minX
  return (
    <svg
      viewBox={`${minX} 0 ${viewWidth} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label="piano keyboard with highlighted scale notes"
    >
      {leadingBlack}
      {whites}
      {blacks}
      {markers}
      {labels}
    </svg>
  )
}
