// OfflineBanner — a slim, muted strip pinned to the top of the viewport while
// the browser is offline. It overlays (position: fixed), so it never pushes
// page content down; it appears on the rare offline tick and disappears the
// moment connectivity returns. role="status" + aria-live="polite" so it is
// announced without hijacking focus.
//
// Mounted once at the App root, OUTSIDE the per-page Shell, so it is wrapped in
// its own `.mu3` element to pick up the design-token scope + base font. Design
// tokens are defined globally on :root / html[data-theme], so light/dark follow
// automatically.

import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="mu3">
      <div className="offline-banner" role="status" aria-live="polite">
        You’re offline. Currently-loaded content remains available.
      </div>
    </div>
  )
}
