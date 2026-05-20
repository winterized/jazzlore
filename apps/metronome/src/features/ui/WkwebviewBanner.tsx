import { useState } from 'react'
import { read, write } from '@jazzlore/music-core'

const DISMISS_KEY = 'metronome:wkwebview-dismissed'

/** A one-line warning banner shown ONLY when the page is opened inside a
 *  known in-app webview (Slack, Discord, Instagram, Claude, etc.) where
 *  both Wake Lock API + NoSleep.js silently fail. Prompts the user to
 *  open in Safari OR add to home screen for the PWA standalone context.
 *
 *  Dismissable. Persisted via @jazzlore/music-core/storage so we don't
 *  re-nag on every visit. The "Open in Safari" link uses the
 *  x-safari-https:// URL scheme (iOS-only — silently falls back to a
 *  normal navigation elsewhere). */
export function WkwebviewBanner() {
  const initialDismissed = read<unknown>(DISMISS_KEY) === true
  const [dismissed, setDismissed] = useState<boolean>(initialDismissed)
  if (dismissed) return null

  const dismiss = (): void => {
    write(DISMISS_KEY, true)
    setDismissed(true)
  }

  const openInSafariHref = (): string => {
    if (typeof window === 'undefined') return '#'
    const url = window.location.href
    // x-safari- prefix opens iOS Safari directly from a WKWebView.
    // Non-iOS browsers ignore the prefix and just navigate normally.
    return url.startsWith('https://') ? `x-safari-${url}` : url
  }

  return (
    <div className="wkwv-banner" role="alert">
      <span className="msg">
        Screen-wake isn't reliable in this in-app browser.{' '}
        <a className="lnk" href={openInSafariHref()}>
          Open in Safari
        </a>{' '}
        or add to Home Screen for the best experience.
      </span>
      <button
        type="button"
        className="dismiss"
        onClick={dismiss}
        aria-label="Dismiss warning"
      >
        ✕
      </button>
    </div>
  )
}

