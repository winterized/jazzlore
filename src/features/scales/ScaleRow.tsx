import type { ScaleDefinition } from './data/curated'
import { formatRoot } from './logic/spelling'
import ScaleScore from './ScaleScore'

type Props = {
  scale: ScaleDefinition
  root: string
  notes: string[]
}

export default function ScaleRow({ scale, notes }: Props) {
  return (
    <article className="scale-row rounded-lg border border-stone-200 p-4 dark:border-stone-700">
      <header className="mb-2">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{scale.name}</h3>
        {scale.alias && (
          <p className="scale-alias text-sm text-stone-500 dark:text-stone-400">{scale.alias}</p>
        )}
      </header>
      <p className="scale-intervals mb-2 font-mono text-sm text-stone-500 dark:text-stone-400">
        {scale.intervalDisplay.join(' ')}
      </p>
      <ScaleScore notes={notes} />
      <p className="scale-notes mt-2 font-mono text-sm text-stone-700 dark:text-stone-200">
        {notes.map(formatRoot).join(' ')}
      </p>
    </article>
  )
}
