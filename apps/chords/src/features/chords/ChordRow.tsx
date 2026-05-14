/**
 * ChordRow — per-chord display row.
 *
 * Composes music-core helpers with packages/ui components to render the full
 * chord entry: symbol (dual-form), full name, intervals, note names, staff
 * score, and piano keyboard. Play and star buttons are placeholder UI in
 * Phase 6 — they gain handlers in Phase 8 (audio) and Phase 9 (collection).
 */

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
import ChordSymbolDisplay from './ChordSymbolDisplay'

type Props = {
  /** Root note in display form, e.g. 'C', 'F♯', 'B♭'. */
  rootNote: string
  /** Full chord definition from the curated list. */
  definition: ChordDefinition
}

export default function ChordRow({ rootNote, definition }: Props) {
  const voicing = chordNotes(rootNote, definition)
  const primary = formatPrimarySymbol(rootNote, definition.primarySuffix)
  const alternateOrNull = formatAlternateSymbol(rootNote, definition.alternateSuffix)
  const alternate = alternateOrNull ?? undefined

  const rootPc = pitchClass(rootNote)
  const scalePcs = voicing.notes.map(pitchClass)
  const startPc = rootToStartPc(rootPc)

  const intervalsLabel = formatIntervals(definition.tonalIntervals)
  const notesLabel = voicing.notes.join(' ')
  const abc = buildChordAbc([...voicing.notes])

  return (
    <article className="chord-row rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div className="flex gap-4">
          <ChordSymbolDisplay primary={primary} alternate={alternate} />
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
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
        <div className="flex shrink-0 items-center gap-2">
          {/* Play button — Phase 8 wires handler */}
          <button
            type="button"
            aria-label={`Play ${primary}`}
            className="rounded-md border border-stone-300 bg-white px-3 py-1 text-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
          >
            <span aria-hidden="true">♪</span>
          </button>
          {/* Star button — Phase 9 wires handler */}
          <button
            type="button"
            aria-label={`Save ${primary} to my collection`}
            aria-pressed={false}
            className="rounded-md px-2 py-1 text-lg leading-none hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <span aria-hidden="true">☆</span>
          </button>
        </div>
      </header>
      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        {abc !== null && (
          <div className="w-full md:w-48 md:shrink-0">
            <AbcScore abc={abc} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <PianoKeyboard scalePcs={scalePcs} rootPc={rootPc} startPc={startPc} />
        </div>
      </div>
    </article>
  )
}
