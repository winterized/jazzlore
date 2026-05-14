/**
 * StarButton — accessible toggle that saves/removes a chord from the
 * collection. Subscribes to chordCollectionStore so it stays in sync even
 * when multiple instances on the same page share the same chord key.
 *
 * Uses useSyncExternalStore (React 18+) which is the React-canonical way to
 * integrate with external mutable stores. The snapshot function is a stable
 * closure re-created only when rootNote/chordId props change, preventing
 * spurious re-renders.
 */

import { useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import type { ChordId } from '@jazzlore/music-core'
import { addChord, getCollection, removeChord, subscribe } from '../collection/chordCollectionStore'

/** Tailwind focus-ring class — matches ChordPlayButton's ring for visual consistency. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-950'

type Props = {
  /** Root note in Unicode display form, e.g. 'C', 'F♯', 'B♭'. */
  rootNote: string
  /** Stable chord id from the curated list. */
  chordId: ChordId
  /**
   * Human-readable chord symbol used in aria-label, e.g. 'Cmaj7', 'B♭m7'.
   * Typically the primary symbol produced by formatPrimarySymbol().
   */
  primary: string
}

export default function StarButton({ rootNote, chordId, primary }: Props) {
  // Build a stable getSnapshot closure for this specific rootNote+chordId pair.
  // Recreated only when props change (useMemo deps). The snapshot reads from
  // the collection array, which itself is a stable reference between writes.
  const getSnapshot = useMemo(
    () => () => getCollection().some((s) => s.rootNote === rootNote && s.chordId === chordId),
    [rootNote, chordId],
  )

  const starred = useSyncExternalStore(subscribe, getSnapshot)

  const toggle = (): void => {
    if (starred) {
      removeChord(rootNote, chordId)
    } else {
      addChord(rootNote, chordId)
    }
  }

  return (
    <button
      type="button"
      aria-pressed={starred}
      aria-label={
        starred
          ? `Remove ${primary} from my collection`
          : `Save ${primary} to my collection`
      }
      onClick={toggle}
      className={`rounded-md px-2 py-1 text-lg leading-none hover:bg-stone-200 dark:hover:bg-stone-800 ${FOCUS_RING}`}
    >
      <span aria-hidden="true">{starred ? '★' : '☆'}</span>
    </button>
  )
}
