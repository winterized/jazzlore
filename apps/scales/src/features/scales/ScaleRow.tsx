import { PianoKeyboard } from '@jazzlore/ui'
import { formatRoot, pitchClass, withOctaves } from '@jazzlore/music-core'
import type { CuratedScale } from './data/curated'
import PlayButton from '../audio/PlayButton'
import ScaleScore from './ScaleScore'
import StarButton from './StarButton'

type Props = {
  scale: CuratedScale
  root: string
  notes: string[]
}

export default function ScaleRow({ scale, root, notes }: Props) {
  const tonic = notes[0]
  const playbackNotes = tonic ? withOctaves([...notes, tonic], 4) : []
  return (
    <article className="scale-row rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <header className="mb-1 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{scale.name}</h3>
        {/* Order: sound then favorite — consistent with the chords app. */}
        <div className="flex items-center gap-2">
          {playbackNotes.length > 0 && (
            <PlayButton
              notes={playbackNotes}
              ariaLabel={`Play ${scale.name} on ${formatRoot(root)}`}
            />
          )}
          <StarButton rootNote={root} scaleId={scale.id} />
        </div>
      </header>
      {/* Description + theory tag, muted (former alias treatment). Full card
          width — below the title/buttons row, not the narrow left column — so
          long lines stay within two lines on mobile. Joined by space-middot-space. */}
      <p className="scale-alias mb-2 text-sm text-stone-600 dark:text-stone-400">
        {scale.description} · {scale.theoryTag}
      </p>
      <p className="scale-notes font-mono text-sm text-stone-700 dark:text-stone-200">
        {notes.map(formatRoot).join(' ')}
      </p>
      <p className="scale-intervals mb-2 font-mono text-sm text-stone-600 dark:text-stone-400">
        {scale.intervalDisplay.join(' ')}
      </p>
      <ScaleScore notes={notes} />
      <PianoKeyboard scalePcs={notes.map(pitchClass)} rootPc={pitchClass(root)} startOctave={4} />
    </article>
  )
}
