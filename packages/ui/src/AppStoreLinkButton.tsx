// AppStoreLinkButton — the official Apple "Download on the App Store" badge,
// linking to an app's App Store listing. Rendered inside the PWA install sheet
// (PwaInstallSheet) on iOS when the native app is live, replacing the "Add to
// Home Screen" instructions; returns null when the app isn't App-Store-available
// yet, so a not-yet-shipped app keeps the PWA flow with no edits here.
//
// Same brand-compliance discipline as the Apple Music work: the badge artwork is
// Apple's official, UNMODIFIED lockup, vendored at ./assets and theme-swapped
// (black on light, white on dark) — never recoloured or restyled. The link is
// same-tab on purpose: a same-tab navigation to apps.apple.com lets iOS hand off
// to the App Store app as a Universal Link; target="_blank" would open a Safari
// web view first, defeating the tap→App-Store UX.

// Apple's official, UNMODIFIED "Download on the App Store" lockups, vendored
// under their original filenames (provenance — same as the Apple Music assets).
import badgeBlack from './assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg'
import badgeWhite from './assets/Download_on_the_App_Store_Badge_US-UK_RGB_wht_092917.svg'
import { APP_STORE_LINKS, type AppStoreKey } from './appStoreLinks'

type Props = {
  /** Which app's listing to link to. */
  appName: AppStoreKey
  /** Human-readable name for the accessible label (e.g. "Metronome"). */
  label: string
  /** Optional anchor-class override. */
  className?: string
}

export function AppStoreLinkButton({ appName, label, className }: Props) {
  const link = APP_STORE_LINKS[appName]
  // Not on the App Store yet → render nothing; the caller falls back to the PWA
  // instructions. (Defensive: the caller already gates on `available`.)
  if (!link.available) return null
  return (
    <a
      href={link.url}
      aria-label={`Download ${label} on the App Store`}
      className={className ?? 'inline-flex items-center justify-center'}
    >
      {/* Theme-swapped official artwork — black lockup on light, white on dark.
          h-10 (40px) = the badge's native art height, so it renders crisp 1:1.
          Decorative (alt=""/aria-hidden) so the anchor's aria-label is the sole
          accessible name. The `dark:` variant keys off data-theme in every app
          (each defines @custom-variant dark + @source's this package). */}
      <img
        src={badgeBlack}
        alt=""
        aria-hidden="true"
        className="block h-10 w-auto dark:hidden"
      />
      <img
        src={badgeWhite}
        alt=""
        aria-hidden="true"
        className="hidden h-10 w-auto dark:block"
      />
    </a>
  )
}
