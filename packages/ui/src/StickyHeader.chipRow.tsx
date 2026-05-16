/**
 * Real scroll-spy chip row for StickyHeader.
 *
 * - Window `scroll` listener (passive) → measures each resolved anchor target's
 *   `getBoundingClientRect().top` → calls `resolveActiveChip` from helpers.
 * - Auto-centers the active chip in the (horizontally scrollable) row using
 *   `centerScrollLeft` from helpers.
 * - Click → `scrollIntoView({ behavior })` on the target element + optional
 *   `onChipActivate(id)` callback.
 * - Missing target ids are silently skipped (no crash before app integration).
 * - `usePrefersReducedMotion` imported from the hook module (DRY — not copied).
 * - Purely presentational; no forbidden imports (music-core / tonal / tone / abcjs).
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './StickyHeader.hooks'
import {
  centerScrollLeft,
  isChipVisible,
  resolveActiveChip,
  type ResolvedTarget,
} from './stickyHeader.helpers'
import type { ChipGroup } from './StickyHeader'

/** A click/search pin holds the active chip until the programmatic scroll
 *  has STOPPED for this long (no scroll events) AND the user then scrolls
 *  again. So a pinned chip never snaps back on its own after the jump — it
 *  only yields to a genuine user scroll. */
const SCROLL_IDLE_MS = 150

// ─── Props ─────────────────────────────────────────────────────────────────────

export type ChipRowProps = {
  chipGroups: ChipGroup[]
  navLabel: string
  onChipActivate?: (id: string) => void
  /** Height of the sticky header, used as the scroll-spy threshold. */
  headerHeight: number
}

/** Imperative handle so the header search can pin a chip active using the
 *  exact same optimistic-set + spy-lock path as a real chip click. */
export type ChipRowHandle = { activate: (id: string) => void }

// ─── Component ─────────────────────────────────────────────────────────────────

const ChipRow = forwardRef<ChipRowHandle, ChipRowProps>(function ChipRow(
  { chipGroups, navLabel, onChipActivate, headerHeight },
  ref,
) {
  const prefersReduced = usePrefersReducedMotion()
  const scrollBehavior: ScrollBehavior = prefersReduced ? 'instant' : 'smooth'

  // Flat ordered list of all chips across all groups — used for scroll-spy.
  const allChips = chipGroups.flatMap((g) => g.chips)

  // Active chip id — defaults to first chip so something is always highlighted.
  const [activeId, setActiveId] = useState<string | null>(allChips[0]?.id ?? null)

  const rowRef = useRef<HTMLElement>(null)

  // A pin (chip click / search select) suppresses scroll-spy while the
  // programmatic scroll runs, then keeps the pinned chip until the user
  // scrolls again — so it never snaps back to a neighbour on its own once the
  // jump finishes. `armedRef` flips true once the scroll has been idle for
  // SCROLL_IDLE_MS; the first scroll after that is user-initiated → release.
  const spyLockedRef = useRef(false)
  const armedRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    },
    [],
  )

  // ── Scroll-spy: window scroll → measure targets → resolveActiveChip ──────────

  useEffect(() => {
    if (allChips.length === 0) return

    const onScroll = () => {
      const targets: ResolvedTarget[] = allChips
        .map((chip) => {
          const el = document.getElementById(chip.id)
          if (!el) return null
          return { id: chip.id, top: el.getBoundingClientRect().top }
        })
        .filter((t): t is ResolvedTarget => t !== null)

      if (targets.length === 0) return

      // Pin handling: while the programmatic scroll is still moving (not yet
      // "armed"), keep deferring — reset the idle timer and ignore spy so the
      // pinned chip stays put. Once the scroll has been idle for
      // SCROLL_IDLE_MS the pin is armed; the NEXT scroll is user-initiated, so
      // release the lock and resume normal scroll-spy from here on.
      if (spyLockedRef.current) {
        if (!armedRef.current) {
          if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
          idleTimerRef.current = setTimeout(() => {
            armedRef.current = true
            idleTimerRef.current = null
          }, SCROLL_IDLE_MS)
          return
        }
        spyLockedRef.current = false
        armedRef.current = false
        if (idleTimerRef.current !== null) {
          clearTimeout(idleTimerRef.current)
          idleTimerRef.current = null
        }
      }

      const newActive = resolveActiveChip(targets, headerHeight)
      if (newActive !== null) setActiveId(newActive)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Run once on mount to set initial state (handles pre-scrolled pages).
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
    // Intentionally depend on a stable snapshot of chip ids and headerHeight.
    // Re-registering on every render would cause churn; chip list rarely changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allChips.map((c) => c.id).join(','), headerHeight])

  // ── Auto-center active chip in the chip row ───────────────────────────────────

  useEffect(() => {
    if (!activeId) return
    const row = rowRef.current
    if (!row) return

    const chip = row.querySelector<HTMLElement>(`[data-chip-id="${activeId}"]`)
    if (!chip) return

    const rowWidth = row.clientWidth
    const totalScrollWidth = row.scrollWidth
    const chipLeft = chip.offsetLeft
    const chipWidth = chip.offsetWidth

    // Only scroll if the chip is not already comfortably visible.
    if (!isChipVisible(row.scrollLeft, rowWidth, chipLeft, chipWidth)) {
      const target = centerScrollLeft(rowWidth, totalScrollWidth, chipLeft, chipWidth)
      if (typeof row.scrollTo === 'function') {
        row.scrollTo({ left: target, behavior: scrollBehavior })
      } else {
        // Fallback for test environments where scrollTo is not implemented.
        row.scrollLeft = target
      }
    }
  }, [activeId, scrollBehavior])

  // ── Click handler ─────────────────────────────────────────────────────────────

  // Optimistically mark a chip active and hold it: spy is suppressed until
  // the programmatic scroll goes idle (armed) and the user then scrolls.
  // Shared by chip clicks AND the header-search pin for identical behaviour.
  function pinActive(id: string) {
    // Gate the lock BEFORE the state update so the auto-center effect that
    // fires right after setActiveId cannot race with scroll events.
    spyLockedRef.current = true
    armedRef.current = false
    if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    // If no scroll happens at all (target already in view), arm after the
    // idle window so a later user scroll can still release the pin.
    idleTimerRef.current = setTimeout(() => {
      armedRef.current = true
      idleTimerRef.current = null
    }, SCROLL_IDLE_MS)
    setActiveId(id)
  }

  // Search-driven activation: pin the chip exactly like a click, but the app
  // (or StickyHeader) owns the scroll, so we do NOT scrollIntoView here.
  useImperativeHandle(ref, () => ({ activate: pinActive }))

  function handleChipClick(id: string) {
    pinActive(id)
    const el = document.getElementById(id)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
    }
    onChipActivate?.(id)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <nav
      ref={rowRef}
      aria-label={navLabel}
      className={[
        'flex items-center gap-[6px] overflow-x-auto',
        'px-[14px] pb-[10px] md:px-[20px] md:pb-[12px]',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      ].join(' ')}
    >
      {chipGroups.map((group, gi) => (
        <div key={`${group.label}-${gi}`} className="contents">
          {/* 1px vertical divider before every group except the first */}
          {gi > 0 && (
            <span
              aria-hidden="true"
              className="h-[14px] w-px shrink-0 bg-stone-200 dark:bg-stone-800"
            />
          )}

          {/* Group category label — omitted when label is empty (scales app) */}
          {group.label.trim() !== '' && (
            <span
              aria-hidden="true"
              className={[
                'shrink-0 px-[6px]',
                'text-[10px] font-semibold tracking-[0.08em] uppercase',
                // Category label at the AA contrast floor (stone-600/300).
                // axe-core's color-contrast rule DOES flag aria-hidden text, so
                // it cannot go lighter than this. The handoff hierarchy (label
                // dimmer than chips) is preserved by making the chips stronger
                // (stone-700/200) rather than the label lighter — see chip
                // styles below. Both stay WCAG AA.
                'text-stone-600 dark:text-stone-300',
                'whitespace-nowrap',
              ].join(' ')}
            >
              {group.label}
            </span>
          )}

          {/* Chips */}
          {group.chips.map((chip) => {
            const isActive = chip.id === activeId
            return (
              <button
                key={chip.id}
                type="button"
                data-chip-id={chip.id}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => handleChipClick(chip.id)}
                className={[
                  'inline-flex h-[26px] shrink-0 items-center px-[10px]',
                  'rounded-[13px] border text-[12px] font-medium',
                  'whitespace-nowrap transition-all duration-[120ms]',
                  isActive
                    ? [
                        // Active: inverted fill — text becomes bg, bg becomes text.
                        'border-stone-900 bg-stone-900 text-stone-100',
                        'dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900',
                      ].join(' ')
                    : [
                        // Inactive: outline style. Text is stone-700/200 — a
                        // step stronger than the AA floor so the chips read as
                        // the foreground and the dimmer category label
                        // (stone-600/300) recedes, matching the handoff
                        // hierarchy while both stay WCAG 1.4.3 AA.
                        'border-stone-300 dark:border-stone-700',
                        'bg-transparent text-stone-700 dark:text-stone-200',
                        'hover:border-stone-400 hover:text-stone-900',
                        'dark:hover:border-stone-500 dark:hover:text-stone-100',
                      ].join(' '),
                ].join(' ')}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
})

export default ChipRow
