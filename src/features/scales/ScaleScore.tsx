import * as abcjs from 'abcjs'
import { useEffect, useRef } from 'react'

type Props = {
  notes: string[] // e.g. ['Bb','C','Db','Eb','F','G','Ab']
  octave?: number // default 4
}

// Pitch order within an octave (C is the boundary in scientific pitch notation).
// Used to detect when we've crossed a C boundary and need to bump octave.
const PITCH_ORDER: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

const noteToAbc = (note: string, octave: number): string => {
  // abcjs notation: uppercase letter = octave 4, lowercase = octave 5
  // commas decrement, apostrophes increment; ^ = sharp, _ = flat
  const accidental = note.endsWith('#') ? '^' : note.endsWith('b') ? '_' : ''
  const letter = note[0]
  if (!letter) return ''
  if (octave === 4) return `${accidental}${letter}`
  if (octave > 4) return `${accidental}${letter.toLowerCase()}${"'".repeat(octave - 5)}`
  return `${accidental}${letter}${','.repeat(4 - octave)}`
}

export default function ScaleScore({ notes, octave = 4 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || notes.length === 0) return

    // Walk the notes; bump octave whenever pitch-order wraps (crossing a C).
    let oct = octave
    let prevOrder = -1
    const abcs = notes.map((n) => {
      const order = PITCH_ORDER[n[0]!] ?? 0
      if (prevOrder !== -1 && order < prevOrder) oct += 1
      prevOrder = order
      return noteToAbc(n, oct)
    })

    // Closing tonic — bump again if its pitch order is less than the last seen
    const closingOrder = PITCH_ORDER[notes[0]![0]!] ?? 0
    const closingOct = closingOrder < prevOrder ? oct + 1 : oct
    abcs.push(noteToAbc(notes[0]!, closingOct))

    const tune = `X:1\nM:none\nK:C\n${abcs.join('')}|`
    abcjs.renderAbc(ref.current, tune, {
      scale: 1,
      staffwidth: 320,
      paddingtop: 0,
      paddingbottom: 0,
    })
  }, [notes, octave])

  return <div ref={ref} className="abcjs-container" aria-label="score" />
}
