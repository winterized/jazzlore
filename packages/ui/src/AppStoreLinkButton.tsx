// AppStoreLinkButton — the official Apple "Download on the App Store" badge,
// linking to an app's App Store listing. Rendered in the header install slot on
// iOS browsers when the native app is live (the InstallOrAppStoreButton picks
// it over the PWA install button); returns null when the app isn't App-Store-
// available yet, so a not-yet-shipped app keeps the PWA flow with no edits here.
//
// Same brand-compliance discipline as the Apple Music work: the badge artwork
// is Apple's official, UNMODIFIED lockup, vendored at ./assets and theme-swapped
// (black on light, white on dark) — never recoloured or restyled. The link is
// same-tab on purpose: a same-tab navigation to apps.apple.com lets iOS hand off
// to the App Store app as a Universal Link; target="_blank" would open a Safari
// web view first, defeating the tap→App-Store UX.

import badgeBlack from './assets/app-store-badge-black.svg'
import badgeWhite from './assets/app-store-badge-white.svg'
import { APP_STORE_LINKS, type AppStoreKey } from './appStoreLinks'

type Props = {
  /** Which app's listing to link to. */
  appName: AppStoreKey
  /** Human-readable name for the accessible label (e.g. "Metronome"). */
  label: string
  /** Optional wrapper-anchor class override (apps pass their header idiom). */
  className?: string
}

export function AppStoreLinkButton({ appName, label, className }: Props) {
  const link = APP_STORE_LINKS[appName]
  // Not on the App Store yet → render nothing; the caller falls back to the PWA
  // install button. (Defensive: the caller already gates on `available`.)
  if (!link.available) return null
  return (
    <a
      href={link.url}
      aria-label={`Download ${label} on the App Store`}
      className={
        className ?? 'inline-flex h-8 items-center justify-center'
      }
    >
      {/* Theme-swapped official artwork — black lockup on light, white on dark.
          Decorative (alt=""/aria-hidden) so the anchor's aria-label is the sole
          accessible name. The `dark:` variant keys off data-theme in every app
          (each defines @custom-variant dark + @source's this package). */}
      <img
        src={badgeBlack}
        alt=""
        aria-hidden="true"
        className="block h-8 w-auto dark:hidden"
      />
      <img
        src={badgeWhite}
        alt=""
        aria-hidden="true"
        className="hidden h-8 w-auto dark:block"
      />
    </a>
  )
}
