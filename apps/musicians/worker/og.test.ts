import { describe, expect, it } from 'vitest'
import {
  buildSitemap,
  musicianOgMeta,
  ogMetaTags,
} from './og'
import type { SearchCorpusEntry } from '../src/lib/types'

describe('musicianOgMeta', () => {
  it('builds a titled, described, canonical-URL meta from a musician', () => {
    const meta = musicianOgMeta({
      id: 'wikidata:Q93341',
      name: 'Miles Davis',
      instrument: 'trumpet',
      era: 'Modal',
      bio: 'American trumpeter and bandleader.',
      image: 'https://commons.example/miles.jpg',
    })
    expect(meta.title).toBe('Miles Davis — Jazzlore')
    expect(meta.description).toBe('American trumpeter and bandleader.')
    expect(meta.url).toBe(
      'https://musicians.jazzlore.com/musicians/wikidata%3AQ93341',
    )
    expect(meta.image).toBe('https://commons.example/miles.jpg')
  })

  it('synthesises a description from era·instrument when no bio', () => {
    const meta = musicianOgMeta({
      id: 'x',
      name: 'Antoine Hervé',
      instrument: 'piano',
      era: 'Contemporary',
    })
    expect(meta.description).toContain('Antoine Hervé')
    expect(meta.description).toContain('Contemporary · piano')
    expect(meta.image).toBeUndefined()
  })

  it('caps the description at 300 chars', () => {
    const meta = musicianOgMeta({
      id: 'x',
      name: 'A',
      bio: 'x'.repeat(500),
    })
    expect(meta.description.length).toBe(300)
  })
})

describe('ogMetaTags', () => {
  it('emits OG + Twitter tags and escapes attribute content', () => {
    const tags = ogMetaTags({
      title: 'A & "B" — Jazzlore',
      description: 'plays <sax>',
      url: 'https://musicians.jazzlore.com/musicians/x',
      image: 'https://img/x.jpg',
    })
    expect(tags).toContain('property="og:title"')
    expect(tags).toContain('A &amp; &quot;B&quot;')
    expect(tags).toContain('plays &lt;sax&gt;')
    expect(tags).toContain('twitter:card" content="summary_large_image"')
    expect(tags).toContain('property="og:image"')
  })

  it('uses summary (no image) card when there is no portrait', () => {
    const tags = ogMetaTags({
      title: 't',
      description: 'd',
      url: 'u',
    })
    expect(tags).toContain('twitter:card" content="summary"')
    expect(tags).not.toContain('og:image')
  })

  it('emits a rel=canonical link to the (encoded) musician URL', () => {
    const tags = ogMetaTags({
      title: 't',
      description: 'd',
      url: 'https://musicians.jazzlore.com/musicians/wikidata%3AQ1',
    })
    expect(tags).toContain(
      '<link rel="canonical" href="https://musicians.jazzlore.com/musicians/wikidata%3AQ1" />',
    )
  })
})

describe('buildSitemap', () => {
  const corpus: SearchCorpusEntry[] = [
    { id: 'wikidata:Q1', name: 'A', aka: [] },
    { id: 'musicbrainz:dupe', name: 'A', aka: [] },
  ]

  it('emits one <loc> per corpus entry + the home URL (faithful, no dedup)', () => {
    const xml = buildSitemap(corpus)
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain(
      '<loc>https://musicians.jazzlore.com/musicians</loc>',
    )
    expect(xml).toContain('musicians/wikidata%3AQ1')
    expect(xml).toContain('musicians/musicbrainz%3Adupe')
    expect((xml.match(/<url>/g) ?? []).length).toBe(3) // home + 2 entries
  })

  it('emits a valid home-only sitemap for an empty corpus', () => {
    const xml = buildSitemap([])
    expect(xml).toContain('<urlset')
    expect((xml.match(/<url>/g) ?? []).length).toBe(1)
  })
})
