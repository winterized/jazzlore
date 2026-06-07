// Widget deep-link parsing. The "Jazz Musicians" home-screen widget (native
// iOS) opens the app with `jazzlore-musicians://musician/<id>`; this maps that
// URL to the in-app React Router path. Pure + framework-free so it's unit
// testable; the listener lives in components/DeepLinkHandler.tsx.

const PREFIX = 'jazzlore-musicians://musician/'

/**
 * Map a widget deep-link URL to the in-app musician route, or `null` when the
 * URL isn't a recognized musician link. The widget emits the canonical id
 * (which contains a `:`), possibly percent-encoded — both forms resolve to the
 * same `/musicians/<encodedId>` path the app's router expects.
 */
export function widgetDeepLinkPath(rawUrl: string): string | null {
  if (typeof rawUrl !== 'string' || !rawUrl.startsWith(PREFIX)) return null
  const raw = rawUrl.slice(PREFIX.length)
  if (raw === '') return null
  let id: string
  try {
    id = decodeURIComponent(raw)
  } catch {
    id = raw
  }
  id = id.trim()
  if (id === '') return null
  return `/musicians/${encodeURIComponent(id)}`
}
