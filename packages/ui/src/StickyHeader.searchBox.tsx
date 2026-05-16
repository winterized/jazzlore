/**
 * SearchBox — header search as a WAI-ARIA 1.2 combobox (input + listbox popup).
 *
 * Purely presentational: the parent computes `results` from the emitted query
 * (apps own the domain data) and gets `onSelect(id)` back. The listbox is
 * portalled to document.body so the sticky header's backdrop/overflow can't
 * clip it (same fix as RootSheet).
 */

import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type SearchResult = {
  /** DOM element id the app scrolls to on select. */
  id: string
  label: string
  sublabel?: string
  /** Scroll-spy chip to pin active on select. Defaults to `id` (chords:
   *  the chord card === a chip). Scales pass the family chip
   *  (`group-<family>`) since the scroll target is the scale row. */
  chipId?: string
}

type Props = {
  results: SearchResult[]
  onQueryChange: (q: string) => void
  onSelect: (id: string) => void
  /** Accessible name for the combobox, e.g. "Search scales". */
  label: string
  placeholder?: string
}

type Pos = { top: number; left: number; width: number }

export default function SearchBox({
  results,
  onQueryChange,
  onSelect,
  label,
  placeholder,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState<Pos | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const hasQuery = query.trim().length > 0
  const showList = open && hasQuery

  // Reposition the portalled popover under the input while open.
  useLayoutEffect(() => {
    if (!showList) return
    const place = (): void => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const width = Math.min(Math.max(r.width, 280), window.innerWidth - 16)
      const left = Math.min(r.left, Math.max(8, window.innerWidth - width - 8))
      setPos({ top: r.bottom + 6, left, width })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [showList])

  // Clamp on read so a shrunk result set can never leave `active` dangling
  // (no setState-in-effect needed; it's also reset on every keystroke).
  const activeIdx = active >= 0 && active < results.length ? active : -1

  const choose = (r: SearchResult): void => {
    onSelect(r.id)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!showList) setOpen(true)
      if (results.length) setActive(activeIdx + 1 >= results.length ? 0 : activeIdx + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length) setActive(activeIdx <= 0 ? results.length - 1 : activeIdx - 1)
    } else if (e.key === 'Enter') {
      const r = results[activeIdx]
      if (showList && r) {
        e.preventDefault()
        choose(r)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (showList) {
        setOpen(false)
      } else if (query) {
        setQuery('')
        onQueryChange('')
      }
    }
  }

  const activeId = activeIdx >= 0 ? `${listId}-o${activeIdx}` : undefined

  return (
    <div className="relative shrink">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          const v = e.target.value
          setQuery(v)
          onQueryChange(v)
          setActive(-1)
          setOpen(v.trim().length > 0)
        }}
        onFocus={() => hasQuery && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={[
          'h-8 w-[130px] sm:w-[200px] rounded-md px-[10px]',
          'border border-stone-300 bg-white text-[13px] text-stone-900',
          'placeholder:text-stone-400',
          'dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
          'transition-colors duration-[120ms]',
        ].join(' ')}
      />

      {showList &&
        createPortal(
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            style={
              pos
                ? { position: 'fixed', top: pos.top, left: pos.left, width: pos.width }
                : { position: 'fixed', top: 0, left: 0 }
            }
            className={[
              'z-[100] max-h-[60vh] overflow-y-auto rounded-md py-[4px]',
              'border border-stone-200 bg-white shadow-lg',
              'dark:border-stone-700 dark:bg-stone-900',
            ].join(' ')}
          >
            {results.length === 0 ? (
              <li
                role="option"
                aria-disabled="true"
                aria-selected={false}
                className="px-[12px] py-[8px] text-[13px] text-stone-500 dark:text-stone-400"
              >
                No matches
              </li>
            ) : (
              results.map((r, i) => (
                // Keyboard selection is handled on the combobox input (Enter)
                // per the WAI-ARIA combobox pattern — options are intentionally
                // not individually focusable, so a per-option key handler would
                // be wrong here. mousedown preventDefault keeps input focus
                // (beats onBlur close); selection runs on click so the option
                // survives the full mousedown→click sequence.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <li
                  key={r.id}
                  id={`${listId}-o${i}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                  className={[
                    'flex cursor-pointer items-baseline gap-2 px-[12px] py-[7px] text-[13px]',
                    i === activeIdx
                      ? 'bg-stone-200 dark:bg-stone-800'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800/60',
                    'text-stone-900 dark:text-stone-100',
                  ].join(' ')}
                >
                  <span className="truncate">{r.label}</span>
                  {r.sublabel !== undefined && (
                    <span className="ml-auto shrink-0 text-[12px] text-stone-500 dark:text-stone-400">
                      {r.sublabel}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  )
}
