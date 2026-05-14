import type { ReactNode } from 'react'

type Props = {
  rootPc?: number // 0..11; undefined = no root highlight
  scalePcs: readonly number[] // 0..11; pitch classes of scale tones
  startOctave?: number // default 4 (only affects data-note attributes for tests)
  showNoteNames?: boolean // default false
}

type KeyState = 'root' | 'scale' | 'off'

const WHITE_KEY_PCS = [0, 2, 4, 5, 7, 9, 11] as const // C D E F G A B
const WHITE_KEY_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

const BLACK_KEY_SPECS = [
  { afterWhite: 0, pc: 1, name: 'C#' },
  { afterWhite: 1, pc: 3, name: 'D#' },
  { afterWhite: 3, pc: 6, name: 'F#' },
  { afterWhite: 4, pc: 8, name: 'G#' },
  { afterWhite: 5, pc: 10, name: 'A#' },
] as const

const WHITE = 32
const BLACK_W = 20
const HEIGHT = 110
const BLACK_H = 70

const classFor = (kind: 'white' | 'black'): string => {
  if (kind === 'white') return 'fill-white dark:fill-stone-100'
  return 'fill-stone-900 dark:fill-stone-950'
}

export default function PianoKeyboard({
  rootPc,
  scalePcs,
  startOctave = 4,
  showNoteNames = false,
}: Props) {
  const scalePcSet = new Set(scalePcs)

  const stateFor = (pc: number): KeyState =>
    pc === rootPc ? 'root' : scalePcSet.has(pc) ? 'scale' : 'off'

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

  // 2 octaves of white keys (14 total)
  for (let i = 0; i < 14; i++) {
    const pcIndex = i % 7
    const pc = WHITE_KEY_PCS[pcIndex]
    const letter = WHITE_KEY_NAMES[pcIndex]
    if (pc === undefined || letter === undefined) continue
    const oct = startOctave + Math.floor(i / 7)
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

  // Black keys: 5 per octave, placed between whites at the gaps after C/D/F/G/A.
  for (let octIdx = 0; octIdx < 2; octIdx++) {
    for (let i = 0; i < BLACK_KEY_SPECS.length; i++) {
      const spec = BLACK_KEY_SPECS[i]
      if (!spec) continue
      const state = stateFor(spec.pc)
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
          className={`${classFor('black')} stroke-stone-900`}
          strokeWidth={1}
        />,
      )
      if (state !== 'off') {
        pushMarker(`bm-${octIdx}-${i}`, x + BLACK_W / 2, BLACK_H - 10, state, 'black')
      }
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
