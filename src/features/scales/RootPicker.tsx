import { DEFAULT_ROOTS, formatRoot } from './logic/spelling'

type Props = {
  selected: string
  onSelect: (root: string) => void
}

const toInternal = (r: string) => r.replace('♭', 'b').replace('♯', '#')

export default function RootPicker({ selected, onSelect }: Props) {
  const selectedInternal = toInternal(selected)
  return (
    <div role="radiogroup" aria-label="Root note" className="grid grid-cols-4 gap-2 md:grid-cols-12">
      {DEFAULT_ROOTS.map((root) => {
        const isSelected = root === selectedInternal
        return (
          <button
            key={root}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(root)}
            className={[
              'rounded-md border px-3 py-3 text-lg font-medium transition',
              isSelected
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-500',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            ].join(' ')}
          >
            {formatRoot(root)}
          </button>
        )
      })}
    </div>
  )
}
