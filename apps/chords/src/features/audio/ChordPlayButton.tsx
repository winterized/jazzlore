/**
 * ChordPlayButton — play a chord via audioEngine.playChord.
 *
 * Mirrors scales' PlayButton pattern with these additions:
 * - `aria-busy` reflects in-flight state (this is a momentary action, not a
 *   toggle — aria-pressed would be misleading semantics).
 * - Auto-release timer: the button returns to idle ~2 s after scheduling
 *   finishes, matching the audible duration of an arp-then-block 7-note chord.
 *   Formula: (n-1) * 150 + 600 ms ≤ 1500 ms. We use a fixed 2 s ceiling so the
 *   idle state returns even if notes.length varies.
 * - Tap-to-restart: the button is NOT disabled while playing. A second click
 *   interrupts the current chord and starts the new one — playChord internally
 *   calls stopAll, so re-entrancy is correct by construction.
 *
 * Note-format pipeline:
 *   notes (Unicode, no octave) → withOctaves → Unicode octaved → toAsciiNotes → ASCII octaved
 *   e.g. ['B♭','D♭','F','A♭'] → ['B♭4','D♭5','F5','A♭5'] → ['Bb4','Db5','F5','Ab5']
 */

import { useEffect, useRef, useState } from 'react'
import { playChord, unlockAudio, withOctaves } from '@jazzlore/music-core'

/** How long (ms) to keep aria-pressed=true after scheduling completes.
 *  Slightly exceeds the max arp-then-block wall time for 7 notes:
 *  (7-1)*150 + 600 = 1500 ms. 2000 gives a comfortable margin. */
const AUTO_RELEASE_MS = 2000

/** Normalise Unicode accidentals (♭ / ♯) to ASCII (b / #) for playChord. */
function toAsciiNotes(notes: string[]): string[] {
  return notes.map((n) => n.replace(/♯/g, '#').replace(/♭/g, 'b'))
}

/** Tailwind class shared with ChordRow's FOCUS_RING constant. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-950'

type Props = {
  /** Primary chord symbol used in aria-label, e.g. 'Cmaj7', 'B♭m7'. */
  primary: string
  /** Note names in display form (Unicode accidentals, no octave numbers),
   *  e.g. ['C','E','G','B'] or ['B♭','D♭','F','A♭']. */
  notes: readonly string[]
}

export default function ChordPlayButton({ primary, notes }: Props) {
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up the auto-release timer on unmount so we don't call setState
  // on an unmounted component.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const onClick = async (): Promise<void> => {
    // Clear any pending auto-release from a previous click.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    setPlaying(true)
    try {
      await unlockAudio()
      const octaved = withOctaves([...notes], 4)
      const ascii = toAsciiNotes(octaved)
      await playChord(ascii)
    } finally {
      // playChord resolves when notes are *scheduled*, not when they finish
      // sounding. Start the auto-release timer so the button returns to idle
      // once the audible duration has elapsed.
      timerRef.current = setTimeout(() => {
        setPlaying(false)
        timerRef.current = null
      }, AUTO_RELEASE_MS)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Play ${primary}`}
      aria-busy={playing}
      className={`rounded-md border border-stone-300 bg-white px-3 py-1 text-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800 ${FOCUS_RING}`}
    >
      <span aria-hidden="true">{playing ? '…' : '♪'}</span>
    </button>
  )
}
