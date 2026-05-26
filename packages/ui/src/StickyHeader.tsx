import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { RootOption } from './RootPicker'
import InlineRootPicker from './StickyHeader.inlineRootPicker'
import RootCompactButton from './StickyHeader.rootCompactButton'
import { usePrefersReducedMotion } from './StickyHeader.hooks'
import ChipRow, { type ChipRowHandle } from './StickyHeader.chipRow'
import SearchBox, { type SearchResult } from './StickyHeader.searchBox'

// ─── Public types ──────────────────────────────────────────────────────────────

export type Chip = { id: string; label: string }
export type ChipGroup = { label: string; chips: Chip[] }
export type { SearchResult }

// ─── Internal sub-components ──────────────────────────────────────────────────

type ThemeButtonProps = {
  theme: 'dark' | 'light'
  onThemeToggle: () => void
}

function ThemeButton({ theme, onThemeToggle }: ThemeButtonProps) {
  return (
    <button
      type="button"
      onClick={onThemeToggle}
      aria-label="Toggle theme"
      aria-pressed={theme === 'dark'}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md',
        'border border-stone-300 bg-white hover:bg-stone-200',
        'dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800',
        'text-stone-900 dark:text-stone-100',
        'transition-colors duration-[120ms]',
      ].join(' ')}
    >
      {/* Explicit glyph color: without it the icon inherited the document's
          default near-black `color`, which on the dark-theme button bg
          measured ~1.4:1 (WCAG 1.4.3 AA fail). stone-900/100 mirrors the
          rest of the header and clears AA in both themes. */}
      <span aria-hidden="true">{theme === 'dark' ? '☀︎' : '☾'}</span>
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

type Props = {
  title: string
  /** SPA-nav-aware link renderer — required; the header never emits a bare <a>. */
  LinkComponent: ComponentType<{ href: string; className?: string; children: ReactNode }>
  utilLink: { label: string; href: string }
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  /** `rootOptions`/`onRootChange` are consumed by the inline picker (desktop)
   *  and the portalled bottom sheet (mobile). */
  rootOptions: readonly RootOption[]
  selectedRoot: string
  onRootChange: (v: string) => void
  /** Scroll-spy chip row data. The ChipRow resolves anchor targets by id from
   *  the document — each `chip.id` must match a DOM element's `id` attribute. */
  chipGroups: ChipGroup[]
  onChipActivate?: (id: string) => void
  /** Accessible name for the chip-row <nav>. Apps pass e.g. "Chord categories"
   *  / "Scale categories". */
  chipNavLabel?: string
  /** Header search. The app computes `searchResults` from the emitted query
   *  (it owns the domain data) and scrolls to the chosen id; the scroll-spy
   *  chip updates for free. `result.id` must be a DOM element id. */
  searchResults?: SearchResult[]
  onSearchQueryChange?: (q: string) => void
  onSearchSelect?: (id: string) => void
  searchLabel?: string
  searchPlaceholder?: string
}

export default function StickyHeader({
  title,
  LinkComponent,
  utilLink,
  theme,
  onThemeToggle,
  rootOptions,
  selectedRoot,
  onRootChange,
  chipGroups,
  onChipActivate,
  chipNavLabel = 'Quick access',
  searchResults = [],
  onSearchQueryChange = () => {},
  onSearchSelect = () => {},
  searchLabel = 'Search',
  searchPlaceholder,
}: Props) {
  const [scrolled, setScrolled] = useState(false)
  const prefersReduced = usePrefersReducedMotion()

  // Measure the header's rendered height so the ChipRow can use it as the
  // scroll-spy threshold. Falls back to 80px (a reasonable constant) until
  // the layout has been measured.
  const headerRef = useRef<HTMLElement>(null)
  const chipRowRef = useRef<ChipRowHandle>(null)
  const [headerHeight, setHeaderHeight] = useState(80)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    // Measure immediately after mount.
    setHeaderHeight(header.getBoundingClientRect().height)

    // Re-measure if the header resizes (e.g., on breakpoint change).
    // ResizeObserver is not available in all test environments — guard it.
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setHeaderHeight(header.getBoundingClientRect().height)
    })
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Row 1 vertical padding: 12px mobile / 14px desktop; tightens when scrolled.
  const rowPadding = scrolled
    ? 'py-[10px] px-[14px] md:py-[10px] md:px-[20px]'
    : 'py-[12px] px-[14px] md:py-[14px] md:px-[20px]'

  // Title: 18px/700/-0.01em; shrinks to 15px/0.88 opacity when scrolled.
  const titleClasses = [
    'font-bold leading-none tracking-[-0.01em] m-0 whitespace-nowrap',
    'text-stone-900 dark:text-stone-100',
    scrolled ? 'text-[15px] opacity-[0.88]' : 'text-[18px]',
    prefersReduced ? '' : 'transition-[font-size,opacity] duration-[180ms] ease-[ease]',
  ]
    .filter(Boolean)
    .join(' ')

  const rowTransition = prefersReduced ? '' : 'transition-[padding] duration-[180ms] ease-[ease]'

  return (
    <header
      ref={headerRef}
      data-scrolled={scrolled ? 'true' : 'false'}
      className={[
        'sticky top-0 z-50',
        // Lift content below the iOS standalone-mode status bar.
        // env() is 0 in non-standalone browsers, so this is a no-op there.
        'pt-[env(safe-area-inset-top,0px)]',
        'bg-stone-100/78 dark:bg-stone-950/78',
        'backdrop-blur-[14px] backdrop-saturate-150',
        'border-b border-stone-200 dark:border-stone-800',
      ].join(' ')}
    >
      {/* Row 1: title + root picker slot + util controls */}
      <div className={['flex items-center gap-3', rowPadding, rowTransition].join(' ')}>
        <h1 className={titleClasses}>{title}</h1>

        {/* Both pickers are always mounted and CSS-gated. a11y correctness
            depends on `display:none` (sm:hidden / hidden) removing the
            inactive picker from the accessibility tree AND tab order — so
            only one role="radiogroup" is ever perceivable. Do NOT swap these
            for visibility:hidden / opacity:0, which would expose a duplicate
            "Root note" radiogroup to assistive tech. */}
        {/* Mobile compact pill (<640px) — portals sheet to document.body */}
        <div className="sm:hidden">
          <RootCompactButton
            rootOptions={rootOptions}
            selectedRoot={selectedRoot}
            onRootChange={onRootChange}
          />
        </div>

        {/* Desktop inline root picker (≥640px) */}
        <div className="hidden sm:flex">
          <InlineRootPicker
            rootOptions={rootOptions}
            selectedRoot={selectedRoot}
            onRootChange={onRootChange}
          />
        </div>

        {/* Spacer pushes util controls to the right */}
        <span className="flex-1" aria-hidden="true" />

        {/* Header search — sits LEFT of the collection link, before the theme
            toggle, on every viewport. Listbox portals out so the sticky
            header can't clip it. */}
        <SearchBox
          results={searchResults}
          onQueryChange={onSearchQueryChange}
          onSelect={(id) => {
            // App scrolls/expands; pin the scroll-spy chip via the same
            // optimistic+lock path a chip click uses. Scales pass the family
            // chip in `chipId` (scroll target is the scale row, ≠ a chip).
            onSearchSelect(id)
            const r = searchResults.find((x) => x.id === id)
            chipRowRef.current?.activate(r?.chipId ?? id)
          }}
          label={searchLabel}
          placeholder={searchPlaceholder}
        />

        {/* "My collection" link. Both variants always mounted + CSS-gated
            (display:none) so only one is in the a11y tree / tab order — same
            pattern as the dual root pickers. The visually-hidden label is the
            link's accessible name on mobile (icon-only). */}
        <LinkComponent
          href={utilLink.href}
          className={[
            'sm:hidden inline-flex h-8 w-8 items-center justify-center rounded-md',
            'border border-stone-300 bg-white hover:bg-stone-200',
            'dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800',
            'text-stone-900 dark:text-stone-100',
            'transition-colors duration-[120ms]',
          ].join(' ')}
        >
          <span className="sr-only">{utilLink.label}</span>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
          </svg>
        </LinkComponent>
        <LinkComponent
          href={utilLink.href}
          className={[
            'hidden sm:inline-flex h-8 items-center rounded-md px-3',
            'border border-stone-300 bg-white hover:bg-stone-200',
            'dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800',
            'text-[13px] font-medium text-stone-900 dark:text-stone-100',
            'whitespace-nowrap transition-colors duration-[120ms]',
          ].join(' ')}
        >
          {utilLink.label}
        </LinkComponent>

        {/* Theme toggle */}
        <ThemeButton theme={theme} onThemeToggle={onThemeToggle} />
      </div>

      {/* Row 2: real scroll-spy chip row */}
      <ChipRow
        ref={chipRowRef}
        chipGroups={chipGroups}
        navLabel={chipNavLabel}
        onChipActivate={onChipActivate}
        headerHeight={headerHeight}
      />
    </header>
  )
}
