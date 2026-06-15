// Per-request OG/SEO injection + dynamic sitemap (Phase C, decision 4 & 7).
//
// v1 SEO posture: OG/meta is injected per-request via HTMLRewriter into the
// SPA shell; JS-hidden body content is explicitly accepted for v1. We rewrite
// the asset HTML's <title> and append OG/Twitter <meta> into <head>. Sitemap
// is served dynamically from the search corpus.

import type { RawMusician, SearchCorpusEntry } from '../src/lib/types'

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

/** The `<head>` injection block (no <title> — that's rewritten in place). */
export function ogMetaTags(meta: OgMeta): string {
  const tags = [
    // Canonical points at the encoded canonical-id URL (meta.url is built from
    // the resolved canonical id), so alias / unencoded-colon variants of a
    // musician collapse to one indexable URL.
    `<link rel="canonical" href="${esc(meta.url)}" />`,
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

// ─── schema.org JSON-LD (Person / MusicGroup) ──────────────────────────────

// There is no person/band discriminator in Aura (all nodes are bare
// `:Musician`), so the type is inferred conservatively: an entity is treated as
// a MusicGroup only when it has NO birth/death date AND its name carries a
// group keyword. Sparse individuals (date-less people) therefore stay Person —
// the safer error — and obvious named ensembles ("… Orchestra", "Delta Piano
// Trio") become MusicGroup. Entities missed by the keyword (e.g. "Weather
// Report") fall back to Person and self-correct via the wikidata/musicbrainz
// `sameAs` links, whose authoritative type Google trusts over ours.
const GROUP_NAME_RE =
  /\b(orchestra|ensemble|quartet|quintet|trio|sextet|septet|octet|big ?band|band)\b/i

function isMusicGroup(m: RawMusician): boolean {
  // Residual false-positive (accepted): a date-less *person* whose name carries
  // a keyword (e.g. a surname "Band", or a stage name with "Trio") is misread
  // as a MusicGroup and loses jobTitle/dates/nationality. Rare, and sameAs lets
  // Google self-correct. `\b` already prevents substring hits ("Bandera").
  const hasDate =
    typeof m.birth_date === 'string' ||
    typeof m.birth_year === 'number' ||
    typeof m.death_date === 'string' ||
    typeof m.death_year === 'number'
  return !hasDate && GROUP_NAME_RE.test(m.name)
}

/** schema.org date: full ISO date if present, else the bare year, else absent. */
function schemaDate(date?: string, year?: number): string | undefined {
  if (typeof date === 'string' && date.trim() !== '') return date.trim()
  if (typeof year === 'number' && Number.isFinite(year)) return String(year)
  return undefined
}

/** Equivalent-entity URLs on authoritative databases — the highest-value field
 * for Google (links the entity into the wikidata/musicbrainz knowledge graph). */
function sameAsLinks(m: RawMusician): string[] {
  const links: string[] = []
  if (m.wikidata_id) links.push(`https://www.wikidata.org/wiki/${m.wikidata_id}`)
  if (m.musicbrainz_id)
    links.push(`https://musicbrainz.org/artist/${m.musicbrainz_id}`)
  if (m.discogs_id) links.push(`https://www.discogs.com/artist/${m.discogs_id}`)
  if (m.wikipedia_url) links.push(m.wikipedia_url)
  if (m.spotify_artist_url) links.push(m.spotify_artist_url)
  if (m.apple_artist_url) links.push(m.apple_artist_url)
  return links
}

function nonEmptyStrings(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    : []
}

/**
 * Build the schema.org JSON-LD document for a musician detail page. Returns the
 * minified, `<script>`-safe JSON string (NOT wrapped in a script tag — injectOg
 * wraps it). Absent fields are omitted: an empty/null value is worse than no
 * value in structured data. Pure + fully unit-tested (unlike injectOg, which
 * needs the Workers HTMLRewriter global).
 */
export function musicianJsonLd(m: RawMusician): string {
  const url = `${SITE}/musicians/${encodeURIComponent(m.id)}`
  const group = isMusicGroup(m)
  const genres = nonEmptyStrings(m.genres)
  const sameAs = sameAsLinks(m)
  const bio = typeof m.bio_summary === 'string' ? m.bio_summary.trim() : ''

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': group ? 'MusicGroup' : 'Person',
    '@id': `${url}#${group ? 'group' : 'person'}`,
    name: m.name,
    url,
  }
  if (bio) data.description = bio
  if (typeof m.picture_url === 'string' && m.picture_url.trim() !== '')
    data.image = m.picture_url.trim()
  if (genres.length > 0) data.genre = genres

  if (!group) {
    // Person-only fields. MusicGroup gets none of these — the heuristic only
    // fires when dates are absent, and jobTitle/nationality aren't valid on a
    // MusicGroup.
    data.jobTitle = 'Musician'
    const birthDate = schemaDate(m.birth_date, m.birth_year)
    const deathDate = schemaDate(m.death_date, m.death_year)
    if (birthDate) data.birthDate = birthDate
    if (deathDate) data.deathDate = deathDate
    const nationality =
      typeof m.nationality === 'string' ? m.nationality.trim() : ''
    if (nationality) data.nationality = nationality
  }

  if (sameAs.length > 0) data.sameAs = sameAs

  // JSON.stringify escapes JSON metacharacters; the extra `<` → < guards
  // against a literal `</script>` in any field breaking out of the script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * Transform the SPA shell `Response`: replace <title> in place, REMOVE the
 * static default <meta name="description"> baked into index.html, then append
 * the per-musician OG/Twitter <meta> + canonical into <head>. Removing the
 * static description avoids emitting two description tags (the generic shell one
 * + the per-musician one), which let Google pick the wrong one (§13 SEO audit).
 * `HTMLRewriter` is a Workers runtime global (typed via @cloudflare/workers-types).
 */
export function injectOg(
  shell: Response,
  meta: OgMeta,
  jsonLd?: string,
): Response {
  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(meta.title)
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        // Drop the generic shell description; ogMetaTags() appends the
        // per-musician one below, leaving exactly one description tag.
        el.remove()
      },
    })
    .on('head', {
      element(el) {
        el.append(ogMetaTags(meta), { html: true })
        if (jsonLd) {
          el.append(
            `<script type="application/ld+json">${jsonLd}</script>`,
            { html: true },
          )
        }
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
