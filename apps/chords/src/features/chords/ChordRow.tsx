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
import { useMediaQuery } from '../../lib/useMediaQuery'
import ChordPlayButton from '../audio/ChordPlayButton'
import ChordSymbolDisplay from './ChordSymbolDisplay'
import StarButton from './StarButton'


type Props = {
  /** Root note in display form, e.g. 'C', 'F♯', 'B♭'. */
  rootNote: string
  /** Full chord definition from the curated list. */
  definition: ChordDefinition
  /** True when rendered inside the multi-column card grid (ChordsPage). At
   *  ≥1280 the card is then half-width and adopts the compact layout. The
   *  collection page omits this → unchanged full-width layout at all widths. */
  inGrid?: boolean
}

export default function ChordRow({ rootNote, definition, inGrid = false }: Props) {
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
      startPc: rootToStartPc(rootPc),
      /** Root-position semitone offsets (root first) — drives chord-mode key
       *  highlighting so each tone shows exactly once, ascending from the root. */
      chordSemitones: definition.intervals,
      intervalsLabel: formatIntervals(definition.tonalIntervals),
      notesLabel: voicing.notes.join(' '),
      abc: buildChordAbc([...voicing.notes]),
      /** Unicode display-form notes, no octave — passed to ChordPlayButton which
       *  applies withOctaves + ASCII normalisation before calling playChord. */
      playNotes: voicing.notes,
    }
  }, [rootNote, definition])

  const { primary, alternate, rootPc, startPc, chordSemitones, intervalsLabel, notesLabel, abc, playNotes } = derived

  // The card is a CSS grid (`.chord-row` rule in index.css) that reflows by
  // breakpoint: ≥768 reproduces the original info|actions / score|keyboard
  // layout; 480–767 puts a compact mini-score on the header row (reclaiming
  // the ~114px the stacked score wasted); <480 keeps the stacked fallback.
  // When in the multi-column grid (inGrid), at ≥1280 each card is half-width
  // so the .chord-card-grid override reverts it to the 480–767 compact layout
  // — a half-width 1280 card == a full 640-viewport card.
  // abcjs renders at a fixed staffwidth, so a single instance can't be both
  // sizes via CSS — use the compact 170 wherever the compact layout applies
  // (480–767, OR inGrid ≥1280), else the original 320. Below 1280 the second
  // query is false so behaviour (and bytes) are unchanged on both pages; the
  // collection page never passes inGrid so it keeps 320 at all widths. The
  // hook re-renders only when crossing the band edges, not per resize.
  const isHeaderScore = useMediaQuery('(min-width: 480px) and (max-width: 767.98px)')
  const isGridXl = useMediaQuery('(min-width: 1280px)')
  const compactScore = isHeaderScore || (inGrid && isGridXl)
  const scoreStaffwidth = compactScore ? 170 : 320

  // Flat grid children in source order info → actions → score → keyboard
  // (a11y/tab/print order); grid-area placement is purely CSS.
  // data-testid anchors the test count regardless of layout.
  return (
    <article data-testid="chord-row" className="chord-row rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <div className="chord-info flex gap-4">
        <ChordSymbolDisplay primary={primary} alternate={alternate} />
        <div>
          <p className="chord-full-name text-sm font-medium text-stone-700 dark:text-stone-300">
            {definition.fullName}
          </p>
          <p className="chord-notes font-mono text-sm text-stone-700 dark:text-stone-200">
            {notesLabel}
          </p>
          <p className="chord-intervals font-mono text-sm text-stone-600 dark:text-stone-400">
            {intervalsLabel}
          </p>
        </div>
      </div>
      {/* Play and star buttons are hidden in print via print:hidden */}
      <div className="chord-actions flex shrink-0 items-center gap-2 print:hidden">
        <ChordPlayButton primary={primary} notes={playNotes} />
        <StarButton rootNote={rootNote} chordId={definition.id} primary={primary} />
      </div>
      {abc !== null && (
        <div className="chord-score">
          <AbcScore abc={abc} staffwidth={scoreStaffwidth} />
        </div>
      )}
      <div className="chord-keyboard min-w-0">
        <PianoKeyboard
          voicing="chord"
          chordSemitones={chordSemitones}
          rootPc={rootPc}
          startPc={startPc}
        />
      </div>
    </article>
  )
}
