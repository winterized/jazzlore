// LABEL_DATA — 6 iconic mid-century jazz labels, ordered by their
// JAZZ-prominence chronology (NOT strict label-founding year — Columbia
// was founded 1888 as a phonograph company but only became a major jazz
// label with Miles Davis' signing in 1955, hence its late position).
// Per the brainstorm decisions (2026-05-21), hand-curated in-repo data —
// no populator dependency, no BFF endpoint. Each entry: ~10 musicians
// whose IDs were resolved against the live /api/musicians/search-index.
//
// "Recorded for" here is liberal: musicians whose canonical work
// belongs to the label, not a strict discography filter. The musician
// detail page is the source of truth for actual releases.

import type { JourneyEntry } from '../JourneyData'

const blueNote: JourneyEntry = {
  slug: 'blue-note',
  name: 'Blue Note',
  kicker: '— FOUNDED 1939 · NEW YORK · ALFRED LION & FRANCIS WOLFF',
  h1: 'Blue Note.',
  subtitle: 'The hard-bop holy of holies — a sound, a font, a Reid Miles cover.',
  icon: '▲',
  musicians: [
    { id: 'wikidata:Q311715', name: 'Art Blakey', hook: 'The Jazz Messengers — Blue Note’s in-house finishing school.' },
    { id: 'wikidata:Q365560', name: 'Horace Silver', hook: 'House composer — “Song for My Father,” “Señor Blues.”' },
    { id: 'wikidata:Q362564', name: 'Lee Morgan', hook: '“The Sidewinder” — the label’s biggest mid-60s hit.' },
    { id: 'wikidata:Q317161', name: 'Wayne Shorter', hook: 'Speak No Evil, JuJu — the writer’s flowering.' },
    { id: 'wikidata:Q318948', name: 'Jimmy Smith', hook: 'Hammond B-3 godfather — the organ-trio franchise.' },
    { id: 'wikidata:Q534842', name: 'Hank Mobley', hook: '“Soul Station” — the middleweight champion of the tenor.' },
    { id: 'wikidata:Q362764', name: 'Donald Byrd', hook: 'Trumpet that ran from hard bop into electric jazz.' },
    { id: 'wikidata:Q105875', name: 'Herbie Hancock', hook: 'Maiden Voyage, Empyrean Isles — Blue Note’s modal masterworks.' },
    { id: 'wikidata:Q505138', name: 'Andrew Hill', hook: 'Point of Departure — the label’s avant-garde conscience.' },
    { id: 'wikidata:Q888571', name: 'Bobby Hutcherson', hook: 'Vibes that opened modal jazz to a new sonic palette.' },
  ],
}

const prestige: JourneyEntry = {
  slug: 'prestige',
  name: 'Prestige',
  kicker: '— FOUNDED 1949 · NEW YORK · BOB WEINSTOCK',
  h1: 'Prestige.',
  subtitle: 'The hard-blowing label where Miles, Trane and Rollins came up.',
  icon: '▪',
  musicians: [
    { id: 'wikidata:Q93341', name: 'Miles Davis', hook: 'The first marathon sessions — Cookin’, Relaxin’, Workin’, Steamin’.' },
    { id: 'wikidata:Q299208', name: 'Sonny Rollins', hook: 'Saxophone Colossus — the breakthrough on Prestige.' },
    { id: 'wikidata:Q7346', name: 'John Coltrane', hook: 'Coltrane the leader — the early albums before Atlantic.' },
    { id: 'wikidata:Q109612', name: 'Thelonious Monk', hook: 'The pre-Riverside sessions where the world caught up.' },
    { id: 'wikidata:Q367508', name: 'Eric Dolphy', hook: 'Out There, Outward Bound — mainstream’s outer doorway.' },
    { id: 'musicbrainz:00dbf694-d614-44cc-91d3-21bf18800e3d', name: 'Gene Ammons', hook: 'Jug — tenor of pure midwestern warmth.' },
    { id: 'wikidata:Q217812', name: 'Coleman Hawkins', hook: 'Late-period Hawk — elder statesman still finding new corners.' },
    { id: 'wikidata:Q706697', name: 'Red Garland', hook: 'Miles’ first-quintet pianist — block-chord elegance.' },
    { id: 'wikidata:Q1382570', name: 'Mose Allison', hook: 'Piano-and-vocals — jazz with a Mississippi drawl.' },
    { id: 'wikidata:Q1346401', name: 'Jaki Byard', hook: 'A pianist of every era at once — stride to free.' },
  ],
}

const verve: JourneyEntry = {
  slug: 'verve',
  name: 'Verve',
  kicker: '— FOUNDED 1956 · NEW YORK · NORMAN GRANZ',
  h1: 'Verve.',
  subtitle: 'The Songbooks. JATP. The label that built the jazz LP.',
  icon: '◈',
  musicians: [
    { id: 'musicbrainz:54799c0e-eb45-4eea-996d-c4d71a63c499', name: 'Ella Fitzgerald', hook: 'The eight Songbooks — the canon canonized.' },
    { id: 'wikidata:Q30587', name: 'Stan Getz', hook: 'Getz/Gilberto — bossa nova into the American living room.' },
    { id: 'wikidata:Q105349', name: 'Oscar Peterson', hook: 'Granz’s house pianist — fluency without bounds.' },
    { id: 'wikidata:Q103767', name: 'Charlie Parker', hook: 'Bird with Strings — the alto in chamber-orchestra dress.' },
    { id: 'musicbrainz:d59c4cda-11d9-48db-8bfe-b557ee602aed', name: 'Billie Holiday', hook: 'Lady Sings the Blues — late-period chronicles.' },
    { id: 'wikidata:Q862106', name: 'Bill Evans', hook: 'Conversations with Myself — piano in counterpoint with piano.' },
    { id: 'wikidata:Q298601', name: 'Wes Montgomery', hook: 'Smokin’ at the Half Note — the small-group peak.' },
    { id: 'wikidata:Q318948', name: 'Jimmy Smith', hook: 'Bashin’, The Cat — organ-trio crossover hits.' },
    { id: 'wikidata:Q110477', name: 'Cannonball Adderley', hook: 'Mercy Mercy Mercy — soul-jazz hits from the live club.' },
    { id: 'musicbrainz:8d08cabf-03a3-4f38-a815-8197a0984f19', name: 'Astrud Gilberto', hook: '“The Girl from Ipanema” — one vocal that named a movement.' },
  ],
}

const columbia: JourneyEntry = {
  slug: 'columbia',
  name: 'Columbia',
  kicker: '— FOUNDED 1888 · NEW YORK · THE OTHER MAJOR',
  h1: 'Columbia.',
  subtitle: 'Where Miles went after Prestige — and the jazz LP went mainstream.',
  icon: '⦿',
  musicians: [
    { id: 'wikidata:Q93341', name: 'Miles Davis', hook: 'Kind of Blue, Sketches of Spain — 30+ years of monuments.' },
    { id: 'musicbrainz:de0222a6-e1c4-403d-8b01-3f66d505061b', name: 'Dave Brubeck', hook: 'Time Out — the first jazz LP to sell a million.' },
    { id: 'wikidata:Q4030', name: 'Duke Ellington', hook: 'Mid-1950s Newport revival — Diminuendo and Crescendo in Blue.' },
    { id: 'musicbrainz:d59c4cda-11d9-48db-8bfe-b557ee602aed', name: 'Billie Holiday', hook: 'Lady in Satin — the late voice over Ray Ellis strings.' },
    { id: 'wikidata:Q109612', name: 'Thelonious Monk', hook: 'Monk’s Dream — the LIFE-magazine moment.' },
    { id: 'wikidata:Q107432', name: 'Charles Mingus', hook: 'Mingus Ah Um — the suite-form composer at full strength.' },
    { id: 'wikidata:Q273076', name: 'Wynton Marsalis', hook: 'The neo-classical insurgency — returning jazz to its canon.' },
    { id: 'musicbrainz:8be0594f-8c13-46bb-ab06-f93ffba5c776', name: 'Tony Bennett', hook: 'The American songbook in tuxedo — with Bill Evans on piano.' },
    { id: 'wikidata:Q105875', name: 'Herbie Hancock', hook: 'Head Hunters — the platinum jazz crossover.' },
    { id: 'wikidata:Q164757', name: 'John McLaughlin', hook: 'Mahavishnu Orchestra’s Inner Mounting Flame — rock-jazz at Columbia.' },
  ],
}

const riverside: JourneyEntry = {
  slug: 'riverside',
  name: 'Riverside',
  kicker: '— FOUNDED 1953 · NEW YORK · ORRIN KEEPNEWS',
  h1: 'Riverside.',
  subtitle: 'Monk’s second home — and Bill Evans’, and Cannonball’s.',
  icon: '◍',
  musicians: [
    { id: 'wikidata:Q109612', name: 'Thelonious Monk', hook: 'Brilliant Corners — the album that finally explained him.' },
    { id: 'wikidata:Q862106', name: 'Bill Evans', hook: 'Sunday at the Village Vanguard — trio jazz reaches its summit.' },
    { id: 'wikidata:Q110477', name: 'Cannonball Adderley', hook: 'Somethin’ Else — the album that out-Miles-d Miles.' },
    { id: 'wikidata:Q298601', name: 'Wes Montgomery', hook: 'The Incredible Jazz Guitar — the first masterpiece.' },
    { id: 'wikidata:Q299208', name: 'Sonny Rollins', hook: 'Freedom Suite — the trio statement on civil rights.' },
    { id: 'wikidata:Q708439', name: 'Johnny Griffin', hook: 'Little Giant — fastest tenor in the room.' },
    { id: 'wikidata:Q709873', name: 'Philly Joe Jones', hook: 'Drum Bombs — Miles’ hi-hat conscience as leader.' },
    { id: 'wikidata:Q885774', name: 'Blue Mitchell', hook: 'Trumpet of Horace Silver’s 60s quintet, in bloom on his own.' },
    { id: 'wikidata:Q707857', name: 'Scott LaFaro', hook: 'Evans’ trio bassist — interactive counterpoint, gone at 25.' },
    { id: 'wikidata:Q740581', name: 'Paul Motian', hook: 'Evans’ trio drummer — brushes that breathed with the piano.' },
  ],
}

const impulse: JourneyEntry = {
  slug: 'impulse',
  name: 'Impulse!',
  kicker: '— FOUNDED 1960 · NEW YORK · CREED TAYLOR',
  h1: 'Impulse!',
  subtitle: 'The house of Trane — and the spiritual avant-garde that followed.',
  icon: '❢',
  musicians: [
    { id: 'wikidata:Q7346', name: 'John Coltrane', hook: 'A Love Supreme — the label’s definitional document.' },
    { id: 'wikidata:Q470617', name: 'Pharoah Sanders', hook: 'Karma, Tauhid — the spiritual tenor at full cry.' },
    { id: 'wikidata:Q200791', name: 'Archie Shepp', hook: 'Fire Music — saxophone as testimony.' },
    { id: 'wikidata:Q1367166', name: 'Marion Brown', hook: 'Ascension — the Coltrane large-ensemble high-water mark.' },
    { id: 'wikidata:Q107432', name: 'Charles Mingus', hook: 'The Black Saint and the Sinner Lady — Mingus’ epic.' },
    { id: 'wikidata:Q299208', name: 'Sonny Rollins', hook: 'East Broadway Run Down — with Coltrane’s rhythm section.' },
    { id: 'wikidata:Q238243', name: 'Alice Coltrane', hook: 'Journey in Satchidananda — harp into devotional jazz.' },
    { id: 'wikidata:Q318619', name: 'McCoy Tyner', hook: 'The Real McCoy — first leader date after Coltrane.' },
    { id: 'wikidata:Q539832', name: 'Yusef Lateef', hook: 'Eastern Sounds — oud, flute, prayer.' },
    { id: 'wikidata:Q448235', name: 'Roy Haynes', hook: 'Out of the Afternoon — his masterpiece, with Rahsaan.' },
  ],
}

export const LABEL_DATA: Record<string, JourneyEntry> = {
  'blue-note': blueNote,
  prestige,
  riverside,
  verve,
  columbia,
  impulse,
}
