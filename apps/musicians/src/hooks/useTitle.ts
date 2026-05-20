// useTitle — single source of truth for document.title.
//
// React Router's SPA navigation never touches <title> from index.html, so a
// tab stuck on "Jazzlore — Jazz musicians" while a reader is deep in Miles
// Davis' page is the default behaviour. Each page that wants a custom title
// calls this hook with the desired string (currently only MusicianPage). The
// unmount cleanup restores the previous title, so detail-to-home transitions
// revert to the default without the home page needing to reset it explicitly.
// Pages that don't call the hook inherit whatever title was already set.

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
    // No title given → ensure default. Deliberately no cleanup: the default
    // IS the neutral state, so restoring it on unmount would be redundant.
    if (document.title !== DEFAULT_TITLE) {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
