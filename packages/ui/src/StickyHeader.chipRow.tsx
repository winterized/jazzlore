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

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './StickyHeader.hooks'
import {
  centerScrollLeft,
  isChipVisible,
  resolveActiveChip,
  type ResolvedTarget,
} from './stickyHeader.helpers'
import type { ChipGroup } from './StickyHeader'

// ─── Props ─────────────────────────────────────────────────────────────────────

export type ChipRowProps = {
  chipGroups: ChipGroup[]
  navLabel: string
  onChipActivate?: (id: string) => void
  /** Height of the sticky header, used as the scroll-spy threshold. */
  headerHeight: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ChipRow({
  chipGroups,
  navLabel,
  onChipActivate,
  headerHeight,
}: ChipRowProps) {
  const prefersReduced = usePrefersReducedMotion()
  const scrollBehavior = prefersReduced ? 'instant' : 'smooth'

  // Flat ordered list of all chips across all groups — used for scroll-spy.
  const allChips = chipGroups.flatMap((g) => g.chips)

  // Active chip id — defaults to first chip so something is always highlighted.
  const [activeId, setActiveId] = useState<string | null>(allChips[0]?.id ?? null)

  const rowRef = useRef<HTMLElement>(null)

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
        row.scrollTo({ left: target, behavior: scrollBehavior as ScrollBehavior })
      } else {
        // Fallback for test environments where scrollTo is not implemented.
        row.scrollLeft = target
      }
    }
  }, [activeId, scrollBehavior])

  // ── Click handler ─────────────────────────────────────────────────────────────

  function handleChipClick(id: string) {
    const el = document.getElementById(id)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: scrollBehavior as ScrollBehavior, block: 'start' })
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
                'text-[10px] font-semibold uppercase tracking-[0.08em]',
                'text-stone-500 dark:text-stone-500',
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
                        // Inactive: outline style (same as Phase-1 stub).
                        'border-stone-300 dark:border-stone-700',
                        'bg-transparent text-stone-500 dark:text-stone-400',
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
}
