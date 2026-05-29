// isNativeApp — detect whether the web build is running inside the Capacitor
// native shell (the iOS / Android wrapper at `capacitor://localhost`).
//
// Capacitor injects `window.Capacitor` at runtime when the web build is
// bundled in the native shell — so we read it directly, with NO dependency on
// `@capacitor/core`. A native WKWebView matches neither `display-mode:
// standalone` nor iOS Safari's `navigator.standalone`, so this is the only
// reliable signal for "we're inside the app".
//
// Pure synchronous function, not a hook: the global is injected before the web
// bundle boots and never toggles, so native-ness is constant for the
// document's lifetime — callers can read it once at render time.

/** The runtime-injected Capacitor global (we don't depend on `@capacitor/core`,
 * so TS has no typing for it). Only the bit we read is declared. */
export interface CapacitorGlobal {
  isNativePlatform?: () => boolean
}

/** True when running inside the Capacitor native shell. Used to hide web-only
 * affordances that are broken or meaningless once wrapped — e.g. the PWA
 * install button (issue #130) and the Print button, whose `window.print()` is
 * a silent no-op in WKWebView (no default print path, unlike Safari). */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor
  return cap?.isNativePlatform?.() === true
}
