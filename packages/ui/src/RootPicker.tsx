import { useState, type KeyboardEvent } from 'react'

export type RootOption = {
  value: string // opaque to the component
  label: string // displayed
  alternate?: { value: string; label: string } // optional second spelling
}

type Props = {
  options: readonly RootOption[]
  selected: string // matches option.value or option.alternate.value
  onSelect: (value: string) => void
}

export default function RootPicker({ options, selected, onSelect }: Props) {
  // Per-option flip state: keyed by option.value, true = showing alternate
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})

  const selectedIndex = options.findIndex(
    (opt) =>
      opt.value === selected ||
      (opt.alternate?.value === selected),
  )

  const moveTo = (nextIndex: number, container: HTMLElement) => {
    const opt = options[nextIndex]
    if (!opt) return
    const isFlipped = flipped[opt.value] ?? false
    const emittedValue = isFlipped && opt.alternate ? opt.alternate.value : opt.value
    onSelect(emittedValue)
    const next = container.querySelector<HTMLButtonElement>(
      `[role="radio"][data-index="${nextIndex}"]`,
    )
    next?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1
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
      {options.map((opt, i) => {
        const isFlipped = flipped[opt.value] ?? false
        const currentLabel = isFlipped && opt.alternate ? opt.alternate.label : opt.label
        const currentValue = isFlipped && opt.alternate ? opt.alternate.value : opt.value
        const alternateLabel = isFlipped ? opt.label : opt.alternate?.label
        const alternateValue = isFlipped ? opt.value : opt.alternate?.value
        const isSelected =
          opt.value === selected || opt.alternate?.value === selected
        return (
          <div key={opt.value} className="relative">
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-index={i}
              onClick={() => onSelect(currentValue)}
              className={[
                'w-full rounded-md border px-3 py-3 text-lg font-medium transition',
                isSelected
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-500',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              ].join(' ')}
            >
              {currentLabel}
            </button>
            {opt.alternate && alternateLabel && alternateValue && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFlipped((prev) => ({ ...prev, [opt.value]: !(prev[opt.value] ?? false) }))
                }}
                aria-label={`Switch ${currentLabel} to ${alternateLabel}`}
                className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-md border border-stone-300 bg-white px-1 text-xs font-medium text-stone-700 shadow hover:bg-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
              >
                {alternateLabel}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
