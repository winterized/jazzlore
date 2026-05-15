/**
 * RootSheet — portalled mobile bottom sheet for root-note selection.
 *
 * Rendered via createPortal(…, document.body) so it is NOT anchored inside
 * the sticky header's ~100px box. Fixes the "position:fixed inside a sticky
 * ancestor" clipping bug called out in the design handoff.
 *
 * a11y: role="dialog" + aria-modal, focus-trap (Tab/Shift+Tab cycle within
 * the sheet), Esc closes, focus restored to trigger on close. Backdrop click
 * also dismisses. Body scroll is left to the ambient layout (aria-modal is
 * sufficient for AT; a full scroll-lock is a nice-to-have).
 */

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { RootOption } from './RootPicker'
import { useEnharmonicFlip } from './enharmonic'

type Props = {
  rootOptions: readonly RootOption[]
  selectedRoot: string
  onRootChange: (value: string) => void
  open: boolean
  onClose: () => void
  /** Ref to the element that triggered the sheet — focus is restored here on close. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export default function RootSheet({
  rootOptions,
  selectedRoot,
  onRootChange,
  open,
  onClose,
  triggerRef,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const { getDisplayed, getAlternateLabel, toggle } = useEnharmonicFlip()

  // Move focus into the sheet when it opens; restore to trigger when it closes.
  useEffect(() => {
    if (!open) return
    const sheet = sheetRef.current
    if (!sheet) return

    // Focus the selected button (aria-checked="true"), or the first focusable
    // element as fallback.
    const selected = sheet.querySelector<HTMLElement>('button[aria-checked="true"]')
    const firstFocusable = sheet.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    ;(selected ?? firstFocusable)?.focus()

    // Capture the trigger ref value inside the effect so the cleanup uses the
    // stable reference captured at mount time, not the (possibly changed) current.
    const trigger = triggerRef.current
    return () => {
      // Restore focus to the trigger when the sheet closes.
      trigger?.focus()
    }
  }, [open, triggerRef])

  // Focus trap + Esc key handler.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const sheet = sheetRef.current
      if (!sheet) return

      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const sheet = (
    <>
      {/* Backdrop */}
      <div
        data-testid="root-sheet-backdrop"
        className="fixed inset-0 z-[100] bg-black/45"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Root note"
        className={[
          'fixed inset-x-0 bottom-0 z-[100]',
          'rounded-t-2xl',
          'bg-white dark:bg-stone-900',
          'border-t border-stone-200 dark:border-stone-800',
          'px-[14px] pt-[8px] pb-[20px]',
          '[padding-bottom:max(20px,env(safe-area-inset-bottom))]',
        ].join(' ')}
      >
        {/* Handle indicator */}
        <div
          aria-hidden="true"
          className="mx-auto mb-[14px] mt-[6px] h-[4px] w-[40px] rounded-full bg-stone-300/40 dark:bg-stone-700/40"
        />

        {/* "Root note" label */}
        <p className="mx-[6px] mb-[10px] text-[13px] font-semibold text-stone-500 dark:text-stone-400">
          Root note
        </p>

        {/* 4-column grid of 44px root buttons */}
        <div
          role="radiogroup"
          aria-label="Root note"
          className="grid grid-cols-4 gap-[6px]"
        >
          {rootOptions.map((opt) => {
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
                  onClick={() => {
                    onRootChange(displayed.value)
                    onClose()
                  }}
                  className={[
                    'h-[44px] w-full rounded-md border text-[15px] font-semibold',
                    'transition-colors duration-[120ms]',
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-stone-900'
                      : [
                          'border-stone-300 bg-white text-stone-900',
                          'hover:bg-stone-200',
                          'dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100',
                          'dark:hover:bg-stone-700',
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
                    className={[
                      'absolute -top-[6px] -right-[4px]',
                      'min-w-[16px] h-[16px] px-[3px]',
                      'grid place-items-center rounded-[3px]',
                      'border border-stone-300 bg-white text-stone-700',
                      'text-[10px] font-medium leading-none',
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
      </div>
    </>
  )

  return createPortal(sheet, document.body)
}
