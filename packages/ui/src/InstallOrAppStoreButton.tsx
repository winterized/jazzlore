// InstallOrAppStoreButton — the single decision point for a header's install
// slot. Encapsulates the mutual exclusivity in ONE place so call sites can't
// accidentally render both: on an iOS browser with a live native app it shows
// Apple's "Download on the App Store" badge; otherwise the PWA install button;
// inside the native shell / installed PWA, nothing.
//
// Drop-in replacement for a bare <PwaInstallButton> — same install-* props, plus
// the `appStoreKey` that names this app's App Store listing.

import { usePwaInstall } from './usePwaInstall'
import { PwaInstallButton } from './PwaInstallButton'
import { AppStoreLinkButton } from './AppStoreLinkButton'
import { APP_STORE_LINKS, chooseInstallAffordance, type AppStoreKey } from './appStoreLinks'

type Props = {
  /** This app's App Store listing key (drives availability + the badge link). */
  appStoreKey: AppStoreKey
  /** Display name — the PWA sheet heading and the App Store aria-label. */
  appName: string
  /** 192px icon for the PWA install sheet preview. */
  appIconHref: string
  /** Per-app accent for the PWA install CTA. */
  appAccent: `#${string}`
  /** Optional class override applied to whichever affordance renders. */
  className?: string
}

export function InstallOrAppStoreButton({
  appStoreKey,
  appName,
  appIconHref,
  appAccent,
  className,
}: Props) {
  const { platform, isStandalone, isNativeApp } = usePwaInstall()
  const affordance = chooseInstallAffordance({
    platform,
    isNativeApp,
    isStandalone,
    available: APP_STORE_LINKS[appStoreKey].available,
  })
  if (affordance === 'none') return null
  if (affordance === 'app-store') {
    return (
      <AppStoreLinkButton
        appName={appStoreKey}
        label={appName}
        className={className}
      />
    )
  }
  return (
    <PwaInstallButton
      appName={appName}
      appIconHref={appIconHref}
      appAccent={appAccent}
      className={className}
    />
  )
}
