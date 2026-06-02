// ShareButton — square icon button that opens the native iOS share sheet
// (@capacitor/share, reached via the runtime Capacitor global by nativeShare).
// Native-shell ONLY: returns null in the browser/PWA, where the PwaInstallButton
// takes this slot instead. The two are mutually exclusive and share an
// identical footprint (h-8 w-8) so the header slot looks the same either way.

import { isNativeApp } from './isNativeApp'
import { nativeShare, type ShareData } from './nativeShare'

const ShareIcon = () => (
  // iOS-style share glyph: a tray (3 sides) with an arrow leaving the top.
  // currentColor stroke inherits the button's theme color.
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M9 11.5V3" />
    <path d="m5.5 6 3.5-3.5L12.5 6" />
    <path d="M4 9.5v3.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5" />
  </svg>
)

type Props = {
  /** Sheet title (e.g. the musician's name). */
  title?: string
  /** Short descriptive text (e.g. a one-line bio/tagline). */
  text?: string
  /** The URL to share. Defaults to the current page. */
  url?: string
  /** Accessible label (e.g. "Share Miles Davis"). */
  label?: string
  /** Optional override for the button's classes. When set, it REPLACES the
   * default stone-bordered footprint so an app can render the button in its own
   * design system (musicians passes its transparent `.ic` class, matching the
   * PwaInstallButton it swaps with). */
  className?: string
}

export function ShareButton({
  title,
  text,
  url,
  label = 'Share',
  className,
}: Props) {
  // Native shell only — in the browser the PWA install button owns this slot.
  if (!isNativeApp()) return null
  const onShare = (): void => {
    void nativeShare({
      title,
      text,
      url: url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
    } satisfies ShareData)
  }
  return (
    <button
      type="button"
      onClick={onShare}
      aria-label={label}
      className={
        className ??
        [
          'inline-flex h-8 w-8 items-center justify-center rounded-md',
          'border border-stone-300 bg-white hover:bg-stone-200',
          'dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800',
          'text-stone-900 dark:text-stone-100',
          'transition-colors duration-[120ms]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
        ].join(' ')
      }
    >
      <ShareIcon />
    </button>
  )
}
