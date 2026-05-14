import type { ReactNode } from 'react'

/**
 * Props for PianoKeyboard.
 *
 * `startPc` — the pitch class (0-11) of the leftmost white key of the visible
 * 2-octave window. Defaults to 0 (C). **Must be a white-key pitch class**:
 * one of 0 (C), 2 (D), 4 (E), 5 (F), 7 (G), 9 (A), 11 (B).
 *
 * Passing a black-key pitch class (1, 3, 6, 8, 10) throws an error at render
 * time with the message: "startPc N is a black key — pass a white-key pitch
 * class (0 C, 2 D, 4 E, 5 F, 7 G, 9 A, 11 B)". This is intentional: the
 * caller must explicitly choose which neighbouring white key to anchor on, so
 * intent is unambiguous when wiring chord roots (Phase 6).
 */
type Props = {
  rootPc?: number // 0..11; undefined = no root highlight
  scalePcs: readonly number[] // 0..11; pitch classes of scale tones
  startOctave?: number // default 4 (only affects data-note attributes for tests)
  startPc?: number // default 0 (C); must be a white-key PC — see JSDoc above
  showNoteNames?: boolean // default false
}

type KeyState = 'root' | 'scale' | 'off'

/** Canonical white-key pitch classes in ascending order within one octave. */
const WHITE_KEY_PCS_BASE = [0, 2, 4, 5, 7, 9, 11] as const

/** Note names corresponding to WHITE_KEY_PCS_BASE. */
const WHITE_KEY_NAMES_BASE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/** Set of valid white-key pitch classes for fast membership checks. */
const WHITE_PC_SET = new Set<number>(WHITE_KEY_PCS_BASE)

/**
 * Black-key specs are defined relative to position-within-octave indices
 * (0..6 = the 7 white keys in one octave). A black key sits between adjacent
 * white-key positions that are a whole step apart. Within a single octave
 * (C..B) those gaps are: C-D, D-E, F-G, G-A, A-B (positions 0-1, 1-2, 3-4,
 * 4-5, 5-6). Between adjacent octaves (B→C next octave) there is no black key
 * (half step). The `afterOctavePos` field identifies the left white key's
 * position inside its octave half (0-based within that octave's 7 keys).
 */
type BlackKeyRelSpec = {
  afterOctavePos: number // 0..6: position of the white key to the left
  semitoneOffset: number // semitone offset from the octave's root pitch class
  name: string
}

/**
 * Black key positions when the octave root is C (standard layout). This is
 * the "template" that gets rotated when startPc is non-zero.
 */
const C_BLACK_SPECS: readonly BlackKeyRelSpec[] = [
  { afterOctavePos: 0, semitoneOffset: 1, name: 'C#' },
  { afterOctavePos: 1, semitoneOffset: 3, name: 'D#' },
  { afterOctavePos: 3, semitoneOffset: 6, name: 'F#' },
  { afterOctavePos: 4, semitoneOffset: 8, name: 'G#' },
  { afterOctavePos: 5, semitoneOffset: 10, name: 'A#' },
]

const WHITE = 32
const BLACK_W = 20
const HEIGHT = 110
const BLACK_H = 70

const classFor = (kind: 'white' | 'black'): string => {
  if (kind === 'white') return 'fill-white dark:fill-stone-100'
  return 'fill-stone-900 dark:fill-stone-950'
}

/**
 * Derive the sequence of 7 white-key pitch classes for one octave starting at
 * `startPc`. E.g. startPc=5 (F) → [5, 7, 9, 11, 0, 2, 4].
 */
function deriveWhiteKeyPcsForOctave(
  startPc: number,
): readonly [number, number, number, number, number, number, number] {
  const idx = WHITE_KEY_PCS_BASE.indexOf(startPc as (typeof WHITE_KEY_PCS_BASE)[number])
  if (idx === -1) {
    throw new Error(
      `startPc ${startPc} is a black key — pass a white-key pitch class (0 C, 2 D, 4 E, 5 F, 7 G, 9 A, 11 B)`,
    )
  }
  const pcs: number[] = []
  for (let i = 0; i < 7; i++) {
    pcs.push(WHITE_KEY_PCS_BASE[(idx + i) % 7] as number)
  }
  return pcs as unknown as [number, number, number, number, number, number, number]
}

/**
 * Derive the note names for one octave starting at `startPc`.
 * E.g. startPc=5 → ['F', 'G', 'A', 'B', 'C', 'D', 'E'].
 */
function deriveWhiteKeyNamesForOctave(
  startPc: number,
): readonly [string, string, string, string, string, string, string] {
  const idx = WHITE_KEY_PCS_BASE.indexOf(startPc as (typeof WHITE_KEY_PCS_BASE)[number])
  const names: string[] = []
  for (let i = 0; i < 7; i++) {
    names.push(WHITE_KEY_NAMES_BASE[(idx + i) % 7] as string)
  }
  return names as unknown as [string, string, string, string, string, string, string]
}

/**
 * Derive black-key specs for a 2-octave window starting at `startPc`.
 *
 * Strategy: for each pair of adjacent white keys in the 14-key sequence,
 * check whether a black key lies between them. A black key exists between two
 * adjacent white keys when they are a whole tone apart (2 semitones). Half
 * steps (E→F and B→C, wrapping across octave boundary) have no black key.
 *
 * We compute the actual pitch class of each potential black key as the midpoint
 * (lower white key pc + 1) mod 12, and look it up in C_BLACK_SPECS to get its
 * display name. The visual X position is simply (whiteKeyIndex + 1) * WHITE -
 * BLACK_W / 2, matching the original formula.
 */
type DerivedBlackSpec = {
  globalWhiteIdx: number // index of the white key to the left (0..13)
  pc: number // 0..11
  name: string
}

function deriveBlackKeySpecs(
  octavePcs: readonly [number, number, number, number, number, number, number],
): readonly DerivedBlackSpec[] {
  const result: DerivedBlackSpec[] = []

  // Build the full 14-key sequence (two repetitions).
  const allPcs: number[] = [
    ...octavePcs,
    ...octavePcs,
  ]

  for (let i = 0; i < 13; i++) {
    const leftPc = allPcs[i] as number
    const rightPc = allPcs[i + 1] as number

    // Compute semitone distance from left to right (mod 12, ascending).
    const dist = ((rightPc - leftPc) % 12 + 12) % 12

    if (dist === 2) {
      // Whole step → black key at leftPc + 1
      const blackPc = (leftPc + 1) % 12
      // Find name from C_BLACK_SPECS
      const spec = C_BLACK_SPECS.find((s) => s.semitoneOffset === blackPc)
      const name = spec?.name ?? `${blackPc}`
      result.push({ globalWhiteIdx: i, pc: blackPc, name })
    }
    // dist === 1 → half step (E→F or B→C): no black key
  }

  return result
}

export default function PianoKeyboard({
  rootPc,
  scalePcs,
  startOctave = 4,
  startPc = 0,
  showNoteNames = false,
}: Props) {
  // Validate startPc — throws for black-key pitch classes.
  if (!WHITE_PC_SET.has(startPc)) {
    throw new Error(
      `startPc ${startPc} is a black key — pass a white-key pitch class (0 C, 2 D, 4 E, 5 F, 7 G, 9 A, 11 B)`,
    )
  }

  const scalePcSet = new Set(scalePcs)

  const stateFor = (pc: number): KeyState =>
    pc === rootPc ? 'root' : scalePcSet.has(pc) ? 'scale' : 'off'

  // Derive the per-call key arrays based on startPc.
  const octavePcs = deriveWhiteKeyPcsForOctave(startPc)
  const octaveNames = deriveWhiteKeyNamesForOctave(startPc)
  const blackSpecs = deriveBlackKeySpecs(octavePcs)

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
    // Scale-tone marker: use a fill that contrasts with the key's background.
    // White keys → dark fill; black keys → light fill. Both meet WCAG 1.4.11
    // non-text contrast (≥ 3:1) comfortably.
    const scaleFill =
      kind === 'white' ? 'fill-stone-700' : 'fill-stone-200'
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

  // 2 octaves of white keys (14 total).
  // Octave number increments each time the pitch class crosses B→C (i.e. when
  // pc=0 appears after a non-zero pc). For C-rooted keyboards this coincides
  // with i%7===0; for other roots (e.g. F-rooted) C can appear mid-sequence.
  let currentOct = startOctave
  let prevPc = -1

  for (let i = 0; i < 14; i++) {
    const pcIndex = i % 7
    const pc = octavePcs[pcIndex]
    const letter = octaveNames[pcIndex]
    if (pc === undefined || letter === undefined) continue

    // Advance octave counter when we cross B→C boundary (pc goes to 0 after non-zero).
    if (i > 0 && pc === 0 && prevPc !== 0) {
      currentOct++
    }
    const oct = currentOct
    prevPc = pc
    const state = stateFor(pc)
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

  // Black keys derived from the rotated layout.
  for (const spec of blackSpecs) {
    const state = stateFor(spec.pc)
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

  const totalWidth = 14 * WHITE
  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label="piano keyboard with highlighted scale notes"
    >
      {whites}
      {blacks}
      {markers}
      {labels}
    </svg>
  )
}
