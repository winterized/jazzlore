import type { ReactNode } from 'react'

type Props = {
  scaleNotes: string[] // canonical, e.g. ['Bb','C','Db','Eb','F','G','Ab']
  root: string // canonical, e.g. 'Bb'
  startOctave: number // octave of the C at or below root
  showNoteNames?: boolean
}

type KeyState = 'root' | 'scale' | 'off'

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

// Pitch classes (0..11) — letter-based with optional sharp/flat suffix.
// We keep this local + tiny rather than reaching into Tonal, because the
// PianoKeyboard's contract is "give me canonical note strings" and we want
// the pure render to stay dependency-free and easy to reason about.
const PC = (note: string): number => {
  const letterOffsets: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }
  const head = note[0]
  if (!head) return 0
  const base = letterOffsets[head]
  if (base === undefined) return 0
  if (note.endsWith('#')) return (base + 1) % 12
  if (note.endsWith('b')) return (base + 11) % 12
  return base
}

const WHITE = 32
const BLACK_W = 20
const HEIGHT = 110
const BLACK_H = 70

// Offsets (in white-key positions within an octave) where black keys appear,
// paired with their canonical sharp name. Black keys sit in the gaps after
// the C, D, F, G, A whites — never after E or B.
const BLACK_KEYS: ReadonlyArray<{ afterWhite: number; name: string }> = [
  { afterWhite: 0, name: 'C#' },
  { afterWhite: 1, name: 'D#' },
  { afterWhite: 3, name: 'F#' },
  { afterWhite: 4, name: 'G#' },
  { afterWhite: 5, name: 'A#' },
]

const classFor = (state: KeyState, kind: 'white' | 'black'): string => {
  if (kind === 'white') {
    if (state === 'root') return 'fill-amber-500'
    if (state === 'scale') return 'fill-amber-200'
    return 'fill-stone-50 dark:fill-stone-200'
  }
  if (state === 'root') return 'fill-amber-700'
  if (state === 'scale') return 'fill-amber-500'
  return 'fill-stone-800 dark:fill-stone-900'
}

export default function PianoKeyboard({
  scaleNotes,
  root,
  startOctave,
  showNoteNames = false,
}: Props) {
  const rootPc = PC(root)
  const scalePcs = new Set(scaleNotes.map(PC))

  const stateFor = (pc: number): KeyState =>
    pc === rootPc ? 'root' : scalePcs.has(pc) ? 'scale' : 'off'

  const whites: ReactNode[] = []
  const blacks: ReactNode[] = []
  const labels: ReactNode[] = []

  // 2 octaves of white keys (14 total)
  for (let i = 0; i < 14; i++) {
    const letter = WHITE_KEYS[i % 7]
    if (!letter) continue
    const oct = startOctave + Math.floor(i / 7)
    const pc = PC(letter)
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
        className={`${classFor(state, 'white')} stroke-stone-400`}
        strokeWidth={1}
      />,
    )
    if (showNoteNames && state !== 'off') {
      labels.push(
        <text
          key={`l-${i}`}
          data-role="note-label"
          x={i * WHITE + WHITE / 2}
          y={HEIGHT - 8}
          textAnchor="middle"
          fontSize={10}
          className="fill-stone-900"
        >
          {letter}
        </text>,
      )
    }
  }

  // Black keys: 5 per octave, placed between whites at the gaps after C/D/F/G/A.
  for (let octIdx = 0; octIdx < 2; octIdx++) {
    for (let i = 0; i < BLACK_KEYS.length; i++) {
      const spec = BLACK_KEYS[i]
      if (!spec) continue
      const pc = PC(spec.name)
      const state = stateFor(pc)
      const x = (octIdx * 7 + spec.afterWhite + 1) * WHITE - BLACK_W / 2
      blacks.push(
        <rect
          key={`b-${octIdx}-${i}`}
          data-role="black-key"
          data-state={state}
          data-note={spec.name}
          x={x}
          y={0}
          width={BLACK_W}
          height={BLACK_H}
          className={`${classFor(state, 'black')} stroke-stone-900`}
          strokeWidth={1}
        />,
      )
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
      {labels}
    </svg>
  )
}
