/**
 * Desktop inline root-note picker for the StickyHeader Row 1.
 *
 * 12 buttons in a horizontal row, 32w × 36h, 4px gap.
 * Active button = amber fill. Ambiguous options carry a superscript badge.
 * Badge click → toggle spelling only. Main button click → onRootChange.
 *
 * a11y: radiogroup with roving tabindex + arrow/Home/End keyboard nav.
 */

import { type KeyboardEvent } from 'react'
import type { RootOption } from './RootPicker'
import { useEnharmonicFlip } from './enharmonic'

type Props = {
  rootOptions: readonly RootOption[]
  selectedRoot: string
  onRootChange: (value: string) => void
}

export default function InlineRootPicker({ rootOptions, selectedRoot, onRootChange }: Props) {
  const { getDisplayed, getAlternateLabel, toggle } = useEnharmonicFlip()

  const selectedIndex = rootOptions.findIndex(
    (opt) => opt.value === selectedRoot || opt.alternate?.value === selectedRoot,
  )

  const moveFocusTo = (nextIndex: number, container: HTMLElement) => {
    const btn = container.querySelector<HTMLButtonElement>(
      `[role="radio"][data-index="${nextIndex}"]`,
    )
    btn?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = rootOptions.length - 1
    const current = selectedIndex >= 0 ? selectedIndex : 0
    let nextIndex: number
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = current === last ? 0 : current + 1
        break
      case 'ArrowLeft':
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
    moveFocusTo(nextIndex, e.currentTarget)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Root note"
      tabIndex={-1}
      className="flex items-center gap-[4px] focus:outline-none"
      onKeyDown={onKeyDown}
    >
      {rootOptions.map((opt, i) => {
        const displayed = getDisplayed(opt)
        const alternateLabel = getAlternateLabel(opt)
        const isSelected =
          opt.value === selectedRoot || opt.alternate?.value === selectedRoot

        return (
          <div key={opt.value} className="relative">
            {/* Main root button */}
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-index={i}
              onClick={() => onRootChange(displayed.value)}
              className={[
                'w-8 h-9 rounded-md border text-[12px] font-semibold',
                'transition-colors duration-[120ms]',
                isSelected
                  ? 'bg-amber-500 border-amber-500 text-stone-900'
                  : [
                      'border-stone-300 bg-white text-stone-900',
                      'hover:bg-stone-200',
                      'dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100',
                      'dark:hover:bg-stone-800',
                    ].join(' '),
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              ].join(' ')}
            >
              {displayed.label}
            </button>

            {/* Enharmonic badge — visible only on ambiguous options */}
            {alternateLabel !== undefined && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(opt.value)
                }}
                aria-label={`Show ${alternateLabel} spelling`}
                tabIndex={-1}
                className={[
                  'absolute -top-[6px] -right-[4px]',
                  'min-w-[14px] h-[14px] px-[2px]',
                  'grid place-items-center rounded-[3px]',
                  'border border-stone-300 bg-white text-stone-700',
                  'text-[8px] font-medium leading-none',
                  'dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200',
                  'hover:bg-stone-100 dark:hover:bg-stone-700',
                  'transition-colors duration-[120ms]',
                ].join(' ')}
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
