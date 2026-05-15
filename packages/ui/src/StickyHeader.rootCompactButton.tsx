/**
 * RootCompactButton — the orange "C ▾" pill shown on mobile (<640px).
 *
 * Owns the sheet-open state internally. Renders the portalled RootSheet when
 * open; the sheet portals to document.body to avoid any sticky-header clipping.
 *
 * a11y: aria-haspopup="dialog", aria-expanded reflects open state.
 * The decorative chevron ▾ is wrapped in aria-hidden="true".
 */

import { useRef, useState } from 'react'
import type { RootOption } from './RootPicker'
import RootSheet from './StickyHeader.rootSheet'

type Props = {
  rootOptions: readonly RootOption[]
  selectedRoot: string
  onRootChange: (value: string) => void
}

export default function RootCompactButton({ rootOptions, selectedRoot, onRootChange }: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Find the display label for the currently selected root.
  const activeOption = rootOptions.find(
    (opt) => opt.value === selectedRoot || opt.alternate?.value === selectedRoot,
  )
  // If the selectedRoot matches the alternate value, show that label.
  const displayLabel =
    activeOption?.alternate?.value === selectedRoot
      ? activeOption.alternate.label
      : (activeOption?.label ?? selectedRoot)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={[
          'inline-flex items-center gap-[4px]',
          'h-8 px-[10px] rounded-md',
          'bg-amber-500 border border-amber-500 text-stone-900',
          'text-[14px] font-bold leading-none',
          'transition-colors duration-[120ms]',
          'hover:bg-amber-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
        ].join(' ')}
      >
        <span>{displayLabel}</span>
        <span aria-hidden="true" className="text-[9px] opacity-70">
          ▾
        </span>
      </button>

      <RootSheet
        rootOptions={rootOptions}
        selectedRoot={selectedRoot}
        onRootChange={onRootChange}
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={buttonRef}
      />
    </>
  )
}
