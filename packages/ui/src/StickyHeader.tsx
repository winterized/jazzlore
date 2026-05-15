import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import type { RootOption } from './RootPicker'
import InlineRootPicker from './StickyHeader.inlineRootPicker'
import RootCompactButton from './StickyHeader.rootCompactButton'

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotion)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ─── Public types ──────────────────────────────────────────────────────────────

export type Chip = { id: string; label: string }
export type ChipGroup = { label: string; chips: Chip[] }

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
        'transition-colors duration-[120ms]',
      ].join(' ')}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀︎' : '☾'}</span>
    </button>
  )
}

// ─── Chip row stub ─────────────────────────────────────────────────────────────

type ChipRowProps = {
  chipGroups: ChipGroup[]
  navLabel: string
  onChipActivate?: (id: string) => void
}

function ChipRow({ chipGroups, navLabel, onChipActivate }: ChipRowProps) {
  return (
    <nav
      aria-label={navLabel}
      className={[
        'flex items-center gap-[6px] overflow-x-auto',
        'px-[14px] pb-[10px] md:px-[20px] md:pb-[12px]',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      ].join(' ')}
    >
      {chipGroups.map((group, gi) => (
        <div key={group.label} className="contents">
          {gi > 0 && (
            <span
              aria-hidden="true"
              className="h-[14px] w-px shrink-0 bg-stone-200 dark:bg-stone-800"
            />
          )}
          <span
            aria-hidden="true"
            className="shrink-0 px-[6px] text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-stone-500"
          >
            {group.label}
          </span>
          {group.chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipActivate?.(chip.id)}
              className={[
                'inline-flex h-[26px] shrink-0 items-center px-[10px]',
                'rounded-[13px] border border-stone-300 dark:border-stone-700',
                'bg-transparent text-[12px] font-medium text-stone-500 dark:text-stone-400',
                'hover:border-stone-400 hover:text-stone-900 dark:hover:border-stone-500 dark:hover:text-stone-100',
                'whitespace-nowrap transition-all duration-[120ms]',
              ].join(' ')}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
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
  /** Final API. `rootOptions`/`onRootChange` are consumed by the real inline
   *  picker in Phase 2 (Phase 1 renders a selectedRoot stub). */
  rootOptions: readonly RootOption[]
  selectedRoot: string
  onRootChange: (v: string) => void
  /** Final API. Real scroll-spy behavior lands in Phase 4. */
  chipGroups: ChipGroup[]
  onChipActivate?: (id: string) => void
  /** Accessible name for the chip-row <nav>. Apps pass e.g. "Chord categories"
   *  / "Scale categories" (Phase 6/7). */
  chipNavLabel?: string
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
}: Props) {
  const [scrolled, setScrolled] = useState(false)
  const prefersReduced = usePrefersReducedMotion()

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

  const rowTransition = prefersReduced
    ? ''
    : 'transition-[padding] duration-[180ms] ease-[ease]'

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={[
        'sticky top-0 z-50',
        'bg-stone-100/78 dark:bg-stone-950/78',
        'backdrop-blur-[14px] backdrop-saturate-150',
        'border-b border-stone-200 dark:border-stone-800',
      ].join(' ')}
    >
      {/* Row 1: title + root picker slot + util controls */}
      <div
        className={[
          'flex items-center gap-3',
          rowPadding,
          rowTransition,
        ].join(' ')}
      >
        <h1 className={titleClasses}>{title}</h1>

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

        {/* Util pill */}
        <LinkComponent
          href={utilLink.href}
          className={[
            'inline-flex h-8 items-center px-3 rounded-md',
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

      {/* Row 2: chip row */}
      <ChipRow chipGroups={chipGroups} navLabel={chipNavLabel} onChipActivate={onChipActivate} />
    </header>
  )
}
