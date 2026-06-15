import { describe, expect, it } from 'vitest'
import {
  buildSitemap,
  musicianJsonLd,
  musicianOgMeta,
  ogMetaTags,
} from './og'
import type { RawMusician, SearchCorpusEntry } from '../src/lib/types'

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

describe('musicianJsonLd', () => {
  const miles: RawMusician = {
    id: 'wikidata:Q93341',
    name: 'Miles Davis',
    birth_date: '1926-05-26',
    birth_year: 1926,
    death_date: '1991-09-28',
    death_year: 1991,
    nationality: 'United States',
    genres: ['jazz', 'bebop', 'cool jazz'],
    bio_summary: 'American trumpeter and bandleader.',
    picture_url: 'https://commons.example/miles.jpg',
    wikipedia_url: 'https://en.wikipedia.org/wiki/Miles_Davis',
    wikidata_id: 'Q93341',
    musicbrainz_id: '561d854a-6a28-4aa7-8c99-323e6ce46c2a',
    discogs_id: '23755',
    spotify_artist_url: 'https://open.spotify.com/artist/0kbYTNQb4Pb1rPbbaF0pT4',
    apple_artist_url: 'https://music.apple.com/us/artist/44984',
  }

  it('builds a complete Person for a fully-populated musician', () => {
    const o = JSON.parse(musicianJsonLd(miles))
    expect(o['@context']).toBe('https://schema.org')
    expect(o['@type']).toBe('Person')
    expect(o['@id']).toBe(
      'https://musicians.jazzlore.com/musicians/wikidata%3AQ93341#person',
    )
    expect(o.url).toBe(
      'https://musicians.jazzlore.com/musicians/wikidata%3AQ93341',
    )
    expect(o.name).toBe('Miles Davis')
    expect(o.description).toBe('American trumpeter and bandleader.')
    expect(o.image).toBe('https://commons.example/miles.jpg')
    expect(o.jobTitle).toBe('Musician')
    expect(o.birthDate).toBe('1926-05-26')
    expect(o.deathDate).toBe('1991-09-28')
    expect(o.nationality).toBe('United States')
    expect(o.genre).toEqual(['jazz', 'bebop', 'cool jazz'])
  })

  it('emits every available external id in sameAs', () => {
    const o = JSON.parse(musicianJsonLd(miles))
    expect(o.sameAs).toEqual([
      'https://www.wikidata.org/wiki/Q93341',
      'https://musicbrainz.org/artist/561d854a-6a28-4aa7-8c99-323e6ce46c2a',
      'https://www.discogs.com/artist/23755',
      'https://en.wikipedia.org/wiki/Miles_Davis',
      'https://open.spotify.com/artist/0kbYTNQb4Pb1rPbbaF0pT4',
      'https://music.apple.com/us/artist/44984',
    ])
  })

  it('omits deathDate for a living musician', () => {
    const o = JSON.parse(
      musicianJsonLd({ ...miles, death_date: undefined, death_year: undefined }),
    )
    expect(o.birthDate).toBe('1926-05-26')
    expect('deathDate' in o).toBe(false)
  })

  it('falls back to year-only dates when no full date is present', () => {
    const o = JSON.parse(
      musicianJsonLd({ ...miles, birth_date: undefined, death_date: undefined }),
    )
    expect(o.birthDate).toBe('1926')
    expect(o.deathDate).toBe('1991')
  })

  it('classifies a date-less named ensemble as MusicGroup', () => {
    const o = JSON.parse(
      musicianJsonLd({
        id: 'musicbrainz:019a2ddd',
        name: 'Delta Piano Trio',
        nationality: 'Netherlands',
        musicbrainz_id: '019a2ddd',
      }),
    )
    expect(o['@type']).toBe('MusicGroup')
    expect(o['@id']).toBe(
      'https://musicians.jazzlore.com/musicians/musicbrainz%3A019a2ddd#group',
    )
    expect(o.name).toBe('Delta Piano Trio')
    expect(o.sameAs).toEqual(['https://musicbrainz.org/artist/019a2ddd'])
    // MusicGroup must NOT carry Person-only properties.
    expect('jobTitle' in o).toBe(false)
    expect('birthDate' in o).toBe(false)
    expect('nationality' in o).toBe(false)
  })

  it('keeps a dated entity as Person even if its name has a group keyword', () => {
    // Date presence overrides the keyword — a real person who happens to have
    // "Trio" in their name stays a Person.
    const o = JSON.parse(
      musicianJsonLd({ id: 'x', name: 'Tito Trio', birth_year: 1940 }),
    )
    expect(o['@type']).toBe('Person')
  })

  it('keeps a date-less individual (no keyword) as Person — the safe default', () => {
    const o = JSON.parse(
      musicianJsonLd({ id: 'x', name: 'Obscure Sideman' }),
    )
    expect(o['@type']).toBe('Person')
    expect(o.jobTitle).toBe('Musician')
  })

  it('omits absent fields entirely (no empty/null values)', () => {
    const o = JSON.parse(musicianJsonLd({ id: 'x', name: 'Sparse' }))
    expect(Object.keys(o).sort()).toEqual([
      '@context',
      '@id',
      '@type',
      'jobTitle',
      'name',
      'url',
    ])
  })

  it('is <script>-safe and round-trips names with special characters', () => {
    const raw = musicianJsonLd({
      id: 'x',
      name: 'A & "B" </script> <Q>',
      bio_summary: 'plays <sax>',
    })
    expect(raw).not.toContain('</script>')
    expect(raw).not.toContain('<')
    expect(raw).toContain('\\u003c')
    const o = JSON.parse(raw)
    expect(o.name).toBe('A & "B" </script> <Q>')
    expect(o.description).toBe('plays <sax>')
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
