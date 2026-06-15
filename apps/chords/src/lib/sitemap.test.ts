import { describe, expect, it } from 'vitest'
import { DEFAULT_ROOTS } from '@jazzlore/music-core'
import committedSitemap from '../../public/sitemap.xml?raw'
import { buildSitemapXml, chordsSitemap, chordsSitemapPaths } from './sitemap'

/** Collapse inter-tag whitespace so a pretty-printed file equals compact output. */
const normalize = (xml: string) => xml.replace(/>\s+</g, '><').trim()

describe('chords sitemap', () => {
  it('emits one URL-safe path per default root', () => {
    const paths = chordsSitemapPaths()
    expect(paths.length).toBe(DEFAULT_ROOTS.length) // 12
    expect(paths).toContain('/chords/C')
    expect(paths).toContain('/chords/D-flat')
    expect(paths).toContain('/chords/F-sharp')
    // No raw accidentals (#, ♭) may leak into a URL.
    expect(paths.some((p) => p.includes('#') || p.includes('♭'))).toBe(false)
  })

  it('builds a well-formed urlset of absolute chords.jazzlore.com URLs', () => {
    const xml = chordsSitemap()
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
    expect(xml).toContain('<loc>https://chords.jazzlore.com/chords/C</loc>')
    expect(xml).toContain(
      '<loc>https://chords.jazzlore.com/chords/F-sharp</loc>',
    )
    expect((xml.match(/<url>/g) ?? []).length).toBe(12)
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  it('escapes XML metacharacters in the loc', () => {
    const xml = buildSitemapXml('https://e.com', ['/a&b'])
    expect(xml).toContain('/a&amp;b')
    expect(xml).not.toContain('/a&b<')
  })

  // Drift guard: the committed static file (served by Cloudflare Static Assets,
  // since chords has no runtime Worker) MUST match what the generator produces.
  // If DEFAULT_ROOTS changes, regenerate public/sitemap.xml from chordsSitemap().
  it('public/sitemap.xml matches the generated sitemap', () => {
    expect(normalize(committedSitemap)).toBe(normalize(chordsSitemap()))
  })
})
