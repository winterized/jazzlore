// useTitle — single source of truth for document.title.
//
// React Router's SPA navigation never touches <title> from index.html, so a
// tab stuck on "Jazzlore — Jazz musicians" while a reader is deep in Miles
// Davis' page is the default behaviour. The detail page calls this hook with
// `"<name> — Jazzlore"`; the Shell calls it with `null` so home/waking
// screens flip back to the default on every shell-level navigation. The
// cleanup-on-unmount path also restores the previous title, so detail-to-
// home transitions get the right value even before the home page's effect
// fires.

import { useEffect } from 'react'

const DEFAULT_TITLE = 'Jazzlore — Jazz musicians'

/**
 * Update document.title on mount/change; restore the default on unmount.
 *
 * Per-page usage:
 *   useTitle(detail.name ? `${detail.name} — Jazzlore` : null)
 *
 * Pass `null` (or omit the call) to keep the default. The hook handles
 * the cleanup so navigating away from a per-musician page restores the
 * default title without each page having to remember to reset it.
 */
export function useTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (title) {
      const prev = document.title
      document.title = title
      return () => {
        document.title = prev
      }
    }
    // No title given → ensure default
    if (document.title !== DEFAULT_TITLE) {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
