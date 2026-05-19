// Per-request OG/SEO injection + dynamic sitemap (Phase C, decision 4 & 7).
//
// v1 SEO posture: OG/meta is injected per-request via HTMLRewriter into the
// SPA shell; JS-hidden body content is explicitly accepted for v1. We rewrite
// the asset HTML's <title> and append OG/Twitter <meta> into <head>. Sitemap
// is served dynamically from the search corpus.

import type { SearchCorpusEntry } from '../src/lib/types'

const SITE = 'https://musicians.jazzlore.com'

export interface OgMeta {
  title: string
  description: string
  /** Canonical URL of the musician page. */
  url: string
  /** Portrait URL when the musician has a free-licensed picture. */
  image?: string
}

/** Build the OG metadata for a musician detail page. Kept tiny + pure. */
export function musicianOgMeta(m: {
  id: string
  name: string
  instrument?: string
  era?: string
  bio?: string
  image?: string
}): OgMeta {
  const facet = [m.era, m.instrument].filter((s) => !!s).join(' · ')
  const title = `${m.name} — Jazzlore`
  const description =
    (m.bio && m.bio.trim() !== ''
      ? m.bio.trim()
      : `${m.name}${facet ? ` (${facet})` : ''} — who they played with, what defined them, and where to listen.`
    ).slice(0, 300)
  return {
    title,
    description,
    url: `${SITE}/musicians/${encodeURIComponent(m.id)}`,
    image: m.image,
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** The `<meta>` block (no <title> — that's rewritten in place). */
export function ogMetaTags(meta: OgMeta): string {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  ]
  if (meta.image) {
    tags.push(`<meta property="og:image" content="${esc(meta.image)}" />`)
    tags.push(`<meta name="twitter:image" content="${esc(meta.image)}" />`)
  }
  return tags.join('')
}

/**
 * Transform the SPA shell `Response`, replacing <title> and appending OG/
 * Twitter <meta> into <head>. `HTMLRewriter` is a Workers runtime global
 * (typed via @cloudflare/workers-types).
 */
export function injectOg(shell: Response, meta: OgMeta): Response {
  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(meta.title)
      },
    })
    .on('head', {
      element(el) {
        el.append(ogMetaTags(meta), { html: true })
      },
    })
    .transform(shell)
}

/** Dynamic `/sitemap.xml` from the cached search corpus (decision 4).
 * Duplicates are kept faithfully (landmine 11) — every node id is a URL. */
export function buildSitemap(corpus: SearchCorpusEntry[]): string {
  const urls = corpus
    .map(
      (e) =>
        `<url><loc>${esc(`${SITE}/musicians/${encodeURIComponent(e.id)}`)}</loc></url>`,
    )
    .join('')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    `<url><loc>${SITE}/musicians</loc></url>` +
    urls +
    '</urlset>'
  )
}
