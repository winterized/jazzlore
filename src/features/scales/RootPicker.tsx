import { useMemo, useState, type KeyboardEvent } from 'react'
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
  const selectedIndex = renderedRoots.findIndex((r) => r === selectedInternal)

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

  const moveTo = (nextIndex: number, container: HTMLElement) => {
    const target = renderedRoots[nextIndex] ?? DEFAULT_ROOTS[nextIndex]!
    onSelect(target)
    const next = container.querySelector<HTMLButtonElement>(
      `[role="radio"][data-index="${nextIndex}"]`,
    )
    next?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = DEFAULT_ROOTS.length - 1
    const current = selectedIndex >= 0 ? selectedIndex : 0
    let nextIndex: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = current === last ? 0 : current + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = current === 0 ? last : current - 1
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = last
        break
      default:
        return
    }
    e.preventDefault()
    moveTo(nextIndex, e.currentTarget)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Root note"
      tabIndex={-1}
      className="grid grid-cols-4 gap-2 md:grid-cols-12 focus:outline-none"
      onKeyDown={onKeyDown}
    >
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
              tabIndex={isSelected ? 0 : -1}
              data-index={i}
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
                className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-md border border-stone-300 bg-white px-1 text-xs font-medium text-stone-700 shadow hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
              >
                {formatRoot(alt)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
