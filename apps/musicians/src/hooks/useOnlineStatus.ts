// useOnlineStatus — reactive `navigator.onLine`.
//
// Seeds from `navigator.onLine` and flips on the window `online` / `offline`
// events. No-navigator safe (returns `true` — assume online — so nothing
// renders the offline UI where there is no navigator).
//
// Note: `navigator.onLine` only RELIABLY reports `false` (a definite offline);
// `true` can be a lie behind a captive portal. We treat it as a conservative
// signal — the offline banner and the failed-navigation state only show when
// the browser is SURE it is offline, never on a real server error.

import { useEffect, useState } from 'react'

function readOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(readOnline)
  useEffect(() => {
    const update = (): void => setOnline(readOnline())
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    // Re-sync once on mount in case connectivity changed between the initial
    // render and this effect firing.
    update()
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}
