import PianoKeyboard from '../../components/PianoKeyboard'
import { withOctaves } from '../../lib/music'
import PlayButton from '../audio/PlayButton'
import type { ScaleDefinition } from './data/curated'
import { formatRoot } from './logic/spelling'
import ScaleScore from './ScaleScore'
import StarButton from './StarButton'

type Props = {
  scale: ScaleDefinition
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
          {scale.alias && (
            <p className="scale-alias text-sm text-stone-600 dark:text-stone-400">{scale.alias}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StarButton rootNote={root} scaleId={scale.id} />
          {playbackNotes.length > 0 && (
            <PlayButton
              notes={playbackNotes}
              ariaLabel={`Play ${scale.name} on ${formatRoot(root)}`}
            />
          )}
        </div>
      </header>
      <p className="scale-notes font-mono text-sm text-stone-700 dark:text-stone-200">
        {notes.map(formatRoot).join(' ')}
      </p>
      <p className="scale-intervals mb-2 font-mono text-sm text-stone-600 dark:text-stone-400">
        {scale.intervalDisplay.join(' ')}
      </p>
      <ScaleScore notes={notes} />
      <PianoKeyboard scaleNotes={notes} root={root} startOctave={4} />
    </article>
  )
}
