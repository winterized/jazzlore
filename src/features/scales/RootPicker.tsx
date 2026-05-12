import { useMemo, useState } from 'react'
import { alternateSpelling, DEFAULT_ROOTS, formatRoot, isAmbiguous, toInternal } from './logic/spelling'
import { slugFromRoot } from './logic/url'

type SpellingMap = Record<string, string> // canonical default → alternate (only when flipped)

type Props = {
  selected: string
  onSelect: (root: string) => void
  /** Optional: external control of spelling overrides */
  spelling?: SpellingMap
  onSpellingChange?: (next: SpellingMap) => void
}

export default function RootPicker({ selected, onSelect, spelling, onSpellingChange }: Props) {
  const [internalSpelling, setInternalSpelling] = useState<SpellingMap>({})
  const effectiveSpelling = spelling ?? internalSpelling

  const renderedRoots = useMemo(
    () => DEFAULT_ROOTS.map((root) => effectiveSpelling[root] ?? root),
    [effectiveSpelling],
  )

  const selectedInternal = toInternal(selected)

  const flip = (defaultRoot: string) => {
    const current = effectiveSpelling[defaultRoot] ?? defaultRoot
    const next = alternateSpelling(current)
    if (!next) return
    const updated: SpellingMap = { ...effectiveSpelling }
    if (next === defaultRoot) {
      delete updated[defaultRoot]
    } else {
      updated[defaultRoot] = next
    }
    if (spelling === undefined) setInternalSpelling(updated)
    onSpellingChange?.(updated)
  }

  return (
    <div role="radiogroup" aria-label="Root note" className="grid grid-cols-4 gap-2 md:grid-cols-12">
      {DEFAULT_ROOTS.map((defaultRoot, i) => {
        const shown = renderedRoots[i]!
        const isSelected = shown === selectedInternal
        const ambiguous = isAmbiguous(defaultRoot)
        const alt = alternateSpelling(shown)
        return (
          <div key={defaultRoot} className="relative">
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(shown)}
              className={[
                'w-full rounded-md border px-3 py-3 text-lg font-medium transition',
                isSelected
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-500',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              ].join(' ')}
            >
              {formatRoot(shown)}
            </button>
            {ambiguous && alt && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); flip(defaultRoot) }}
                aria-label={`Switch ${slugFromRoot(shown)} to ${slugFromRoot(alt)}`}
                className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-stone-300 bg-white text-xs text-stone-700 shadow hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
              >
                {formatRoot(alt).slice(-1)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
