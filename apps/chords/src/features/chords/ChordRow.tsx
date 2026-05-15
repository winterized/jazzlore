/**
 * ChordRow — per-chord display row.
 *
 * Composes music-core helpers with packages/ui components to render the full
 * chord entry: symbol (dual-form), full name, intervals, note names, staff
 * score, and piano keyboard. The play button is wired to audioEngine.playChord
 * via ChordPlayButton (Phase 8). The star button gains a handler in Phase 9.
 */

import { useMemo } from 'react'
import { AbcScore, PianoKeyboard } from '@jazzlore/ui'
import {
  buildChordAbc,
  chordNotes,
  formatAlternateSymbol,
  formatPrimarySymbol,
  pitchClass,
} from '@jazzlore/music-core'
import type { ChordDefinition } from '@jazzlore/music-core'
import { formatIntervals } from '../../lib/formatIntervals'
import { rootToStartPc } from '../../lib/rootToStartPc'
import ChordPlayButton from '../audio/ChordPlayButton'
import ChordSymbolDisplay from './ChordSymbolDisplay'
import StarButton from './StarButton'


type Props = {
  /** Root note in display form, e.g. 'C', 'F♯', 'B♭'. */
  rootNote: string
  /** Full chord definition from the curated list. */
  definition: ChordDefinition
}

export default function ChordRow({ rootNote, definition }: Props) {
  // Memoise the music-core round-trip so changing the root in Phase 7 doesn't
  // re-derive 27 chords on every render. Helpers are pure; the cache key is
  // exactly (rootNote, definition).
  const derived = useMemo(() => {
    const voicing = chordNotes(rootNote, definition)
    const rootPc = pitchClass(rootNote)
    return {
      primary: formatPrimarySymbol(rootNote, definition.primarySuffix),
      alternate: formatAlternateSymbol(rootNote, definition.alternateSuffix) ?? undefined,
      rootPc,
      scalePcs: voicing.notes.map(pitchClass),
      startPc: rootToStartPc(rootPc),
      intervalsLabel: formatIntervals(definition.tonalIntervals),
      notesLabel: voicing.notes.join(' '),
      abc: buildChordAbc([...voicing.notes]),
      /** Unicode display-form notes, no octave — passed to ChordPlayButton which
       *  applies withOctaves + ASCII normalisation before calling playChord. */
      playNotes: voicing.notes,
    }
  }, [rootNote, definition])

  const { primary, alternate, rootPc, scalePcs, startPc, intervalsLabel, notesLabel, abc, playNotes } = derived

  // data-testid (rather than getByRole('article')) anchors the test count
  // against future layout that might wrap row content in nested articles.
  return (
    <article data-testid="chord-row" className="chord-row rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div className="flex gap-4">
          <ChordSymbolDisplay primary={primary} alternate={alternate} />
          <div>
            <p className="chord-full-name text-sm font-medium text-stone-700 dark:text-stone-300">
              {definition.fullName}
            </p>
            <p className="chord-notes font-mono text-sm text-stone-700 dark:text-stone-200">
              {notesLabel}
            </p>
            <p className="chord-intervals font-mono text-sm text-stone-500 dark:text-stone-400">
              {intervalsLabel}
            </p>
          </div>
        </div>
        {/* Play and star buttons are hidden in print via print:hidden */}
        <div className="flex shrink-0 items-center gap-2 print:hidden">
          <ChordPlayButton primary={primary} notes={playNotes} />
          <StarButton rootNote={rootNote} chordId={definition.id} primary={primary} />
        </div>
      </header>
      <div className="chord-body mt-3 flex flex-col gap-3 md:flex-row">
        {abc !== null && (
          <div className="chord-score w-full md:w-48 md:shrink-0">
            <AbcScore abc={abc} />
          </div>
        )}
        <div className="chord-keyboard min-w-0 flex-1">
          <PianoKeyboard scalePcs={scalePcs} rootPc={rootPc} startPc={startPc} />
        </div>
      </div>
    </article>
  )
}
