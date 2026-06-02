// nativeShare — invoke the native iOS share sheet through the runtime-injected
// Capacitor global, with NO dependency on `@capacitor/*` (mirrors isNativeApp /
// hideNativeSplash). In the browser/PWA there is no `window.Capacitor.Plugins`,
// so the optional chain short-circuits to undefined and this no-ops — callers
// gate on isNativeApp() so it is only ever reached inside the native shell,
// where the @capacitor/share plugin injects `window.Capacitor.Plugins.Share`.

export interface ShareData {
  /** Sheet title (e.g. the musician's name). */
  title?: string
  /** Short descriptive text (e.g. a one-line bio/tagline). */
  text?: string
  /** The URL to share. */
  url?: string
}

interface SharePlugin {
  share: (options: ShareData) => Promise<unknown>
}

/**
 * Open the native share sheet. No-op outside the Capacitor native shell.
 * Resolves whether the user shares or cancels (a cancel rejects the plugin
 * promise, which is swallowed — cancelling is not an error).
 */
export async function nativeShare(data: ShareData): Promise<void> {
  if (typeof window === 'undefined') return
  const plugin = (
    window as Window & {
      Capacitor?: { Plugins?: { Share?: SharePlugin } }
    }
  ).Capacitor?.Plugins?.Share
  // Validate the reach-through shape: a no-op (rather than a thrown TypeError)
  // if a future @capacitor/share renames/changes `share`.
  if (typeof plugin?.share !== 'function') return
  try {
    await plugin.share(data)
  } catch {
    // Swallowed deliberately: a user cancel OR a genuine plugin failure both
    // reject here, and a failed share is low-stakes with no good UI — non-fatal
    // either way.
  }
}
