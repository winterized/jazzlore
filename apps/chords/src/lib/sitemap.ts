// Sitemap source-of-truth for the chords app.
//
// chords.jazzlore.com is served by an assets-only Cloudflare Worker (no Worker
// `main`) — unlike musicians, whose Worker serves /sitemap.xml dynamically from
// Aura. So the chords sitemap is the committed static file `public/sitemap.xml`,
// served verbatim by Cloudflare Static Assets. We deliberately do NOT generate
// it from a vite plugin: vite.config.ts is loaded by node's ESM resolver, which
// cannot follow @jazzlore/music-core's extensionless re-exports, so importing
// this module there breaks the config. Instead, `chordsSitemap()` is the
// canonical generator and a drift-guard test asserts public/sitemap.xml matches
// it — regenerate the file from this function if DEFAULT_ROOTS ever changes.
//
// The crawlable surface is the 12 root pages (`/chords/<slug>`); every chord
// renders WITHIN a root page, so chords are not separate URLs. The paths are
// derived from DEFAULT_ROOTS (the single source of truth shared with the
// router) via slugFromRoot. Only the 12 canonical spellings are listed — the 5
// enharmonic alternates (C#, D#, Gb, G#, A#) are deliberately omitted to avoid
// emitting duplicate-content URLs for the same pitch class.

import { DEFAULT_ROOTS, slugFromRoot } from '@jazzlore/music-core'

const ORIGIN = 'https://chords.jazzlore.com'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Canonical crawlable paths: one per default root spelling (URL-safe slugs). */
export function chordsSitemapPaths(): string[] {
  return DEFAULT_ROOTS.map((root) => `/chords/${slugFromRoot(root)}`)
}

/** Well-formed `<urlset>` for the given absolute paths under `origin`. */
export function buildSitemapXml(origin: string, paths: readonly string[]): string {
  const urls = paths
    .map((p) => `<url><loc>${esc(origin + p)}</loc></url>`)
    .join('')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls +
    '</urlset>'
  )
}

/** The complete chords sitemap document. */
export function chordsSitemap(): string {
  return buildSitemapXml(ORIGIN, chordsSitemapPaths())
}
