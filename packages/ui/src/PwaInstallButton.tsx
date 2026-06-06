// PwaInstallButton — square icon button that opens the PWA-install
// instructions sheet. Matches the StickyHeader theme button's footprint
// exactly so it slots in cleanly next to it. Hidden when the app is already
// running in standalone mode or inside the Capacitor native shell (no point
// installing twice — see issue #130).

import { useState } from 'react'
import { usePwaInstall } from './usePwaInstall'
import { PwaInstallSheet } from './PwaInstallSheet'
import type { AppStoreKey } from './appStoreLinks'

type Props = {
  /** App name shown in the sheet (e.g. "Scales"). */
  appName: string
  /** Path to the 192px PNG icon (e.g. "/icons/icon-192.png"). Rendered as a
   * preview at the top of the sheet so users see the icon they're about to
   * pin to their home screen. */
  appIconHref: string
  /** Per-app accent color, as a hex literal (e.g. "#6f8caa"). The template
   * literal type prevents a caller from accidentally passing arbitrary CSS
   * into the inline `style.backgroundColor` of the install CTA. */
  appAccent: `#${string}`
  /** Optional override for the trigger button's classes. When set, it REPLACES
   * the default stone-bordered footprint so an app can render the button in its
   * own design system (e.g. musicians passes its transparent `.ic` class). The
   * default is unchanged, so metronome/scales/chords are unaffected. */
  className?: string
  /** App Store listing key. When set AND the app is App-Store-available, the
   * sheet shows Apple's "Download on the App Store" badge instead of the iOS
   * PWA instructions (the header button itself is unchanged). Omit for apps with
   * no App Store listing (e.g. musicians) — the sheet keeps PWA instructions. */
  appStoreKey?: AppStoreKey
}

const InstallIcon = () => (
  // 18×18 tray (3 sides — left/right/bottom) with a downward arrow inside.
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
    <path d="M9 3v8" />
    <path d="m5.5 7.5 3.5 3.5 3.5-3.5" />
    <path d="M3.5 12.5v1.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1.5" />
  </svg>
)

export function PwaInstallButton({
  appName,
  appIconHref,
  appAccent,
  className,
  appStoreKey,
}: Props) {
  const { isStandalone, isNativeApp } = usePwaInstall()
  const [open, setOpen] = useState(false)
  // Hide when already installed (standalone PWA) or wrapped in the Capacitor
  // native shell — in both cases an install prompt is pointless (issue #130).
  if (isStandalone || isNativeApp) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Install ${appName} as an app`}
        aria-haspopup="dialog"
        aria-expanded={open}
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
        <InstallIcon />
      </button>
      {open && (
        <PwaInstallSheet
          appName={appName}
          appIconHref={appIconHref}
          appAccent={appAccent}
          appStoreKey={appStoreKey}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
