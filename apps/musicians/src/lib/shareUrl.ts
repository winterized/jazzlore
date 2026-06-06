// shareUrl — build the canonical, publicly-shareable URL for a musician page.
//
// The native iOS shell (Capacitor) serves the app from `capacitor://localhost`,
// so `window.location.href` resolves to that local scheme — sharing it produces
// a dead `capacitor://localhost/musicians/…` link recipients can't open, and
// iOS renders no title card for an un-fetchable URL. Always re-base the current
// path onto the stable public origin instead. Pure + React-free so it's unit-
// testable and reusable from any share/copy surface.

/** The production origin, no trailing slash. Hard-coded: it is stable and there
 * is no plan to change it (a relative `/api` works in browser/PWA but the native
 * shell has no same-origin BFF — same constraint that makes `bffGet` absolute). */
export const MUSICIANS_ORIGIN = 'https://musicians.jazzlore.com'

/** Re-base a router pathname + search onto the public origin. Pass
 * `location.pathname` and `location.search` from `useLocation()` (pathname
 * always starts with `/`, search is `''` or `?…`).
 *
 * `location.hash` is INTENTIONALLY omitted: the only hash in use is the
 * transient `#about` sheet (DetailView), and a shared link should land on the
 * clean musician page, never re-open a disclosure sheet the recipient never
 * opened. So a share fired while `#about` is open still shares the bare page. */
export function canonicalShareUrl(pathname: string, search: string): string {
  return `${MUSICIANS_ORIGIN}${pathname}${search}`
}
