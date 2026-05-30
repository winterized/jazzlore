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
      <header className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{scale.name}</h3>
          {/* Description + theory tag in the former alias slot — same muted
              treatment. Joined by space-middot-space. */}
          <p className="scale-alias text-sm text-stone-600 dark:text-stone-400">
            {scale.description} · {scale.theoryTag}
          </p>
        </div>
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
