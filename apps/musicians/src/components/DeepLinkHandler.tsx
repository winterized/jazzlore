import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { App as CapApp } from '@capacitor/app'
import { isNativeApp } from '@jazzlore/ui'
import { widgetDeepLinkPath } from '../lib/deepLink'

/**
 * Native-only: routes inbound widget taps
 * (`jazzlore-musicians://musician/<id>`) to the in-app musician page via the
 * `@capacitor/app` `appUrlOpen` event. Renders nothing. No-op in the browser /
 * PWA (the event never fires there), but gated on `isNativeApp()` anyway so we
 * never register a listener off the native shell. Must be mounted inside the
 * Router (uses `useNavigate`).
 */
export function DeepLinkHandler(): null {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNativeApp()) return
    const handle = CapApp.addListener('appUrlOpen', ({ url }) => {
      const path = widgetDeepLinkPath(url)
      if (path) navigate(path)
    })
    return () => {
      void handle.then((listener) => listener.remove())
    }
  }, [navigate])

  return null
}
