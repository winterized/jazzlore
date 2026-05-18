// Jazzlore Musicians — shared data for exploration mocks
// All copy is factual where possible. Antoine Hervé is deliberately sparse to
// stress-test missing-data states.

const BOBBY = {
  id: 'bobby-timmons',
  name: 'Bobby Timmons',
  given: 'Robert Henry Timmons',
  era: 'Hard bop',
  years: '1956 – 1974',
  instruments: ['Piano'],
  birth: { date: 'Dec 19, 1935', place: 'Philadelphia, PA' },
  death: { date: 'Mar 1, 1974', place: 'New York, NY', age: 38 },
  bio: [
    'Pianist and composer whose hymn-tinged blues gave hard bop its soul. His tunes "Moanin\'", "Dat Dere", and "This Here" became standards before he turned twenty-five, recorded first with Art Blakey\'s Jazz Messengers and again with the Cannonball Adderley Quintet that he joined the next year.',
    'Timmons grew up in a deeply religious Black family in North Philadelphia — his grandfather a minister, his father a sometime preacher — and the church\'s harmonic language is audible in everything he wrote. The funk that shows up in his comping is not a stylistic affectation; it is the music he grew up inside.',
    'Between 1960 and 1968 he led a handful of trio sessions for Riverside and Prestige. Critics admired them; the audience that had bought "Moanin\'" did not follow. Alcoholism slowly took his career and then his life; he died in 1974, aged 38.'
  ],
  bioShort: 'Pianist and composer whose hymn-tinged blues gave hard bop its soul. "Moanin\'", "Dat Dere", and "This Here" — three of the most-played tunes in the idiom — are all his.',
  collaborators: [
    { name: 'Art Blakey',         instrument: 'Drums',     because: 'Moanin\' · A Night in Tunisia · The Big Beat',     era: '1958–60', count: 7 },
    { name: 'Cannonball Adderley',instrument: 'Alto sax',  because: 'In San Francisco · At the Lighthouse',             era: '1959–60', count: 5 },
    { name: 'Lee Morgan',         instrument: 'Trumpet',   because: 'Moanin\' · The Big Beat',                           era: '1958–60', count: 4 },
    { name: 'Benny Golson',       instrument: 'Tenor sax', because: 'Moanin\' · The Big Beat',                           era: '1958',    count: 3 },
    { name: 'Wayne Shorter',      instrument: 'Tenor sax', because: 'A Night in Tunisia · Like Someone in Love',         era: '1960',    count: 3 },
    { name: 'Sam Jones',          instrument: 'Bass',      because: 'In San Francisco · This Here Is Bobby Timmons',     era: '1959–60', count: 4 },
    { name: 'Jymie Merritt',      instrument: 'Bass',      because: 'Moanin\' · A Night in Tunisia',                     era: '1958–60', count: 3 },
    { name: 'Louis Hayes',        instrument: 'Drums',     because: 'In San Francisco · At the Lighthouse',              era: '1959–60', count: 3 },
    { name: 'Nat Adderley',       instrument: 'Cornet',    because: 'In San Francisco · At the Lighthouse',              era: '1959–60', count: 3 },
    { name: 'Ron Carter',         instrument: 'Bass',      because: 'Sweet & Soulful Sounds · From the Bottom',          era: '1962–64', count: 2 }
  ],
  records: [
    { title: 'Moanin\'',                                          artist: 'Art Blakey & the Jazz Messengers', year: 1959, label: 'Blue Note', cat: 'BLP 4003',  role: 'Piano, composer' },
    { title: 'The Cannonball Adderley Quintet in San Francisco',  artist: 'The Cannonball Adderley Quintet',  year: 1959, label: 'Riverside', cat: 'RLP 12-311',role: 'Piano' },
    { title: 'This Here Is Bobby Timmons',                        artist: 'Bobby Timmons',                    year: 1960, label: 'Riverside', cat: 'RLP 12-317',role: 'Leader, piano' },
    { title: 'A Night in Tunisia',                                artist: 'Art Blakey & the Jazz Messengers', year: 1961, label: 'Blue Note', cat: 'BLP 4049',  role: 'Piano' },
    { title: 'The Big Beat',                                      artist: 'Art Blakey & the Jazz Messengers', year: 1960, label: 'Blue Note', cat: 'BLP 4029',  role: 'Piano, composer' },
    { title: 'Soul Time',                                         artist: 'Bobby Timmons',                    year: 1960, label: 'Riverside', cat: 'RLP 12-334',role: 'Leader, piano' },
    { title: 'Easy Does It',                                      artist: 'Bobby Timmons',                    year: 1961, label: 'Riverside', cat: 'RLP 12-351',role: 'Leader, piano' }
  ],
  links: {
    spotify:   'https://open.spotify.com/search/Bobby%20Timmons',
    apple:     'https://music.apple.com/search?term=Bobby+Timmons',
    wiki:      'https://en.wikipedia.org/wiki/Bobby_Timmons',
    musicbrainz: 'https://musicbrainz.org/artist/...',
    wikidata:  'https://www.wikidata.org/wiki/Q...'
  }
};

const ANTOINE = {
  id: 'antoine-herve',
  name: 'Antoine Hervé',
  given: 'Antoine Hervé',
  era: 'Contemporary',
  years: '1980 – present',
  instruments: ['Piano'],
  birth: { date: 'May 23, 1959', place: 'Saint-Mandé, France' },
  death: null,
  bio: null,           // sparse: no bio
  bioShort: null,
  collaborators: [
    { name: 'Didier Lockwood', instrument: 'Violin',  because: 'ONJ session, 1989',       era: '1989', count: 1 },
    { name: 'Eric Le Lann',    instrument: 'Trumpet', because: 'one shared session',      era: 'c.1988', count: 1 }
  ],
  records: [
    { title: 'Orchestre National de Jazz 1989', artist: 'Antoine Hervé / ONJ',   year: 1989, label: 'Label Bleu', cat: '—',     role: 'Conductor, piano' },
    { title: 'Live in Paris',                   artist: 'Antoine Hervé Trio',     year: 2003, label: 'Naïve',     cat: '—',     role: 'Leader, piano' }
  ],
  duplicate: 'Possibly the same person as Antoine Hervé (#a-herve-2). Help us merge.',
  notes: 'French pianist and composer. Directed the Orchestre National de Jazz, 1987–89. Limited data in our source — flag if you can add to it.',
  links: {
    spotify: 'https://open.spotify.com/search/Antoine%20Hervé',
    apple:   'https://music.apple.com/search?term=Antoine+Hervé',
    wiki:    null,                  // no English Wikipedia
    musicbrainz: 'https://musicbrainz.org/artist/...',
    wikidata: null
  }
};

// 12 curated starting points for Home.
const HOME_MUSICIANS = [
  { id:'miles',     name:'Miles Davis',        era:'1945–91', inst:'Trumpet',  why:'Cool · Modal · Fusion' },
  { id:'trane',     name:'John Coltrane',      era:'1955–67', inst:'Tenor sax',why:'A Love Supreme' },
  { id:'monk',      name:'Thelonious Monk',    era:'1944–82', inst:'Piano',    why:'Round Midnight' },
  { id:'mingus',    name:'Charles Mingus',     era:'1943–77', inst:'Bass',     why:'The Black Saint' },
  { id:'evans',     name:'Bill Evans',         era:'1950–80', inst:'Piano',    why:'Sunday at the Village Vanguard' },
  { id:'blakey',    name:'Art Blakey',         era:'1944–90', inst:'Drums',    why:'Jazz Messengers' },
  { id:'rollins',   name:'Sonny Rollins',      era:'1949–...', inst:'Tenor sax',why:'Saxophone Colossus' },
  { id:'cannonball',name:'Cannonball Adderley',era:'1955–75', inst:'Alto sax', why:'Mercy, Mercy, Mercy' },
  { id:'hancock',   name:'Herbie Hancock',     era:'1960–...', inst:'Piano',    why:'Maiden Voyage' },
  { id:'shorter',   name:'Wayne Shorter',      era:'1959–23', inst:'Tenor sax',why:'Speak No Evil' },
  { id:'mccoy',     name:'McCoy Tyner',        era:'1960–20', inst:'Piano',    why:'The Real McCoy' },
  { id:'timmons',   name:'Bobby Timmons',      era:'1956–74', inst:'Piano',    why:'Moanin\'' }
];

// Duotone palette — pairs of colours used for the photo-placeholder tiles.
// All are restrained, none competes with the amber accent.
const DUOTONES = [
  ['#1a2436', '#5b7aa0'], // dusk blue
  ['#2a1f1a', '#a07a5b'], // sepia
  ['#1f2a23', '#6b9075'], // forest
  ['#2a1d24', '#a06b7e'], // mauve
  ['#251f1a', '#b08755'], // amber-warm (used for hero accents)
  ['#1a242a', '#5b8aa0'], // steel
  ['#2a261a', '#9a8a4f'], // ochre
  ['#241a2a', '#7a5b9a'], // violet
  ['#1f2421', '#75906b'], // olive
  ['#2a1a1f', '#a05b6b'], // wine
  ['#1a1f2a', '#5b6ba0'], // indigo
  ['#26241f', '#8a805b']  // taupe
];

// Deterministic duotone pick by string hash, so the same musician always
// gets the same tile across screens.
function duotoneFor(key) {
  let h = 0;
  const s = String(key || '');
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return DUOTONES[Math.abs(h) % DUOTONES.length];
}

// Initials fallback ("Bobby Timmons" → "BT")
function initialsOf(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
}

Object.assign(window, { BOBBY, ANTOINE, HOME_MUSICIANS, DUOTONES, duotoneFor, initialsOf });
