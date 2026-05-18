// Jazzlore Musicians · Pass 2 data
// Enriched with topRecord + count + relationship "group" on every collaborator
// so the connection card can render the why on its own. Both Bobby and Miles
// are fleshed out so we can stress-test the navigator against scarcity (~10
// collaborators) and abundance (~100, of which we show the strongest).

// ─── Bobby Timmons ──────────────────────────────────────────────────────
const BOBBY2 = {
  id: 'bobby-timmons',
  name: 'Bobby Timmons',
  era: 'Hard bop',
  years: '1956 – 1974',
  primary: 'Piano',
  birth: { date: 'Dec 19, 1935', place: 'Philadelphia, PA' },
  death: { date: 'Mar 1, 1974', place: 'New York, NY', age: 38 },
  // Single-paragraph bio (pass 2 reframe: bio is footnote)
  bioLine:
    "Pianist and composer whose hymn-tinged blues gave hard bop its soul — \"Moanin'\", \"Dat Dere\", \"This Here\" all his, all standards before he turned twenty-five.",
  bioFull: [
    "Pianist and composer whose hymn-tinged blues gave hard bop its soul. \"Moanin'\", \"Dat Dere\", and \"This Here\" were all his and all standards before he turned twenty-five, first recorded with Art Blakey's Jazz Messengers and again with the Cannonball Adderley Quintet that he joined the next year.",
    "Timmons grew up in a deeply religious Black family in North Philadelphia; the church's harmonic language is audible in everything he wrote. He recorded a handful of trio dates as a leader between 1960 and 1968. Alcoholism took the career, then the life; he died in 1974, aged 38."
  ],
  collabs: [
    { name: 'Art Blakey',          inst: 'Drums',     top: { t: "Moanin'",                 y: 1958 }, count: 7, group: 'sameband',  rel: 'Bandleader · Jazz Messengers' },
    { name: 'Cannonball Adderley', inst: 'Alto sax',  top: { t: 'In San Francisco',        y: 1959 }, count: 5, group: 'sameband',  rel: 'Bandleader · Adderley Quintet' },
    { name: 'Lee Morgan',          inst: 'Trumpet',   top: { t: "Moanin'",                 y: 1958 }, count: 4, group: 'sameband',  rel: 'Messengers frontline' },
    { name: 'Benny Golson',        inst: 'Tenor sax', top: { t: "Moanin'",                 y: 1958 }, count: 3, group: 'sameband',  rel: 'Messengers frontline' },
    { name: 'Wayne Shorter',       inst: 'Tenor sax', top: { t: 'A Night in Tunisia',      y: 1960 }, count: 3, group: 'sameband',  rel: 'Messengers frontline (later)' },
    { name: 'Sam Jones',           inst: 'Bass',      top: { t: 'In San Francisco',        y: 1959 }, count: 4, group: 'sameband',  rel: 'Adderley rhythm section' },
    { name: 'Jymie Merritt',       inst: 'Bass',      top: { t: "Moanin'",                 y: 1958 }, count: 3, group: 'sameband',  rel: 'Messengers rhythm section' },
    { name: 'Louis Hayes',         inst: 'Drums',     top: { t: 'In San Francisco',        y: 1959 }, count: 3, group: 'sameband',  rel: 'Adderley rhythm section' },
    { name: 'Nat Adderley',        inst: 'Cornet',    top: { t: 'At the Lighthouse',       y: 1960 }, count: 3, group: 'sameband',  rel: 'Adderley frontline' },
    { name: 'Ron Carter',          inst: 'Bass',      top: { t: 'Sweet & Soulful Sounds',  y: 1962 }, count: 2, group: 'sameera',   rel: 'Riverside-era trio' },
    { name: 'Tommy Flanagan',      inst: 'Piano',     top: null,                                       count: 0, group: 'sameera',   rel: 'Contemporary, never recorded together' },
    { name: 'Horace Silver',       inst: 'Piano',     top: null,                                       count: 0, group: 'mentor',    rel: 'Predecessor in the Messengers piano chair' }
  ],
  records: [
    { t: "Moanin'",                                       a: 'Art Blakey & the Jazz Messengers',  y: 1959, label: 'Blue Note', cat: 'BLP 4003' },
    { t: 'The Cannonball Adderley Quintet in San Francisco', a: 'Cannonball Adderley Quintet',     y: 1959, label: 'Riverside', cat: 'RLP 12-311' },
    { t: 'This Here Is Bobby Timmons',                    a: 'Bobby Timmons',                      y: 1960, label: 'Riverside', cat: 'RLP 12-317' },
    { t: 'A Night in Tunisia',                            a: 'Art Blakey & the Jazz Messengers',  y: 1961, label: 'Blue Note', cat: 'BLP 4049' },
    { t: 'The Big Beat',                                  a: 'Art Blakey & the Jazz Messengers',  y: 1960, label: 'Blue Note', cat: 'BLP 4029' },
    { t: 'Soul Time',                                     a: 'Bobby Timmons',                      y: 1960, label: 'Riverside', cat: 'RLP 12-334' }
  ]
};

// ─── Miles Davis ────────────────────────────────────────────────────────
// The abundance case — ~100 collaborators in the full graph, we surface ~12.
const MILES2 = {
  id: 'miles-davis',
  name: 'Miles Davis',
  era: 'Cool · Modal · Fusion',
  years: '1945 – 1991',
  primary: 'Trumpet',
  birth: { date: 'May 26, 1926', place: 'Alton, IL' },
  death: { date: 'Sep 28, 1991', place: 'Santa Monica, CA', age: 65 },
  bioLine:
    'Trumpeter who redrew jazz\'s territory at least five times — bebop, cool, hard bop, modal, fusion — and built each new band from the players he then made famous.',
  bioFull: [
    'Trumpeter who redrew jazz\'s territory at least five times — bebop with Bird, the cool nonet, the marathon hard-bop quintet, the modal experiments of Kind of Blue, the second great quintet\'s open-form swing, and finally the electric fusion of Bitches Brew.',
    'A bandleader whose ear was the engine: every record is also the launch of a player or three. Coltrane, Cannonball, Bill Evans, Wayne Shorter, Tony Williams, Herbie Hancock, Joe Zawinul, John McLaughlin — each first heard properly through Miles.'
  ],
  collabs: [
    { name: 'John Coltrane',     inst: 'Tenor sax',  top: { t: 'Kind of Blue',         y: 1959 }, count: 12, group: 'sameband', rel: 'First Great Quintet, 1955–60' },
    { name: 'Bill Evans',        inst: 'Piano',      top: { t: 'Kind of Blue',         y: 1959 }, count:  2, group: 'sameband', rel: 'Modal sessions, 1958–59' },
    { name: 'Cannonball Adderley',inst:'Alto sax',   top: { t: 'Kind of Blue',         y: 1959 }, count:  4, group: 'sameband', rel: 'Sextet frontline, 1958–59' },
    { name: 'Paul Chambers',     inst: 'Bass',       top: { t: 'Kind of Blue',         y: 1959 }, count: 22, group: 'sameband', rel: 'First Quintet rhythm' },
    { name: 'Red Garland',       inst: 'Piano',      top: { t: "Round About Midnight", y: 1957 }, count: 11, group: 'sameband', rel: 'First Quintet rhythm' },
    { name: 'Philly Joe Jones',  inst: 'Drums',      top: { t: "Round About Midnight", y: 1957 }, count: 12, group: 'sameband', rel: 'First Quintet rhythm' },
    { name: 'Wayne Shorter',     inst: 'Tenor sax',  top: { t: 'Nefertiti',            y: 1968 }, count: 11, group: 'sameband', rel: 'Second Great Quintet, 1964–68' },
    { name: 'Herbie Hancock',    inst: 'Piano',      top: { t: 'Miles Smiles',         y: 1967 }, count:  9, group: 'sameband', rel: 'Second Great Quintet' },
    { name: 'Ron Carter',        inst: 'Bass',       top: { t: 'E.S.P.',               y: 1965 }, count: 12, group: 'sameband', rel: 'Second Great Quintet' },
    { name: 'Tony Williams',     inst: 'Drums',      top: { t: 'Miles Smiles',         y: 1967 }, count:  9, group: 'sameband', rel: 'Second Great Quintet' },
    { name: 'Gil Evans',         inst: 'Arranger',   top: { t: 'Sketches of Spain',    y: 1960 }, count:  4, group: 'frequent', rel: 'Big-band collaborator, 1957–62' },
    { name: 'Joe Zawinul',       inst: 'Keys',       top: { t: 'In a Silent Way',      y: 1969 }, count:  3, group: 'sameband', rel: 'Electric-era keyboard' },
    { name: 'John McLaughlin',   inst: 'Guitar',     top: { t: 'Bitches Brew',         y: 1970 }, count:  4, group: 'sameband', rel: 'Electric-era guitar' },
    { name: 'Chick Corea',       inst: 'Keys',       top: { t: 'Bitches Brew',         y: 1970 }, count:  4, group: 'sameband', rel: 'Electric-era keyboard' },
    { name: 'Charlie Parker',    inst: 'Alto sax',   top: { t: 'Now\'s the Time',      y: 1953 }, count:  6, group: 'mentor',   rel: 'First bandleader, 1945–48' },
    { name: 'Hank Mobley',       inst: 'Tenor sax',  top: { t: 'Someday My Prince',    y: 1961 }, count:  3, group: 'sameera',  rel: 'Brief touring tenor, 1961' }
  ],
  records: [
    { t: 'Kind of Blue',           a: 'Miles Davis', y: 1959, label: 'Columbia', cat: 'CL 1355'  },
    { t: 'Bitches Brew',           a: 'Miles Davis', y: 1970, label: 'Columbia', cat: 'GP 26'    },
    { t: "'Round About Midnight",  a: 'Miles Davis', y: 1957, label: 'Columbia', cat: 'CL 949'   },
    { t: 'Sketches of Spain',      a: 'Miles Davis', y: 1960, label: 'Columbia', cat: 'CL 1480'  },
    { t: 'In a Silent Way',        a: 'Miles Davis', y: 1969, label: 'Columbia', cat: 'CS 9875'  },
    { t: 'Miles Smiles',           a: 'Miles Davis', y: 1967, label: 'Columbia', cat: 'CL 2601'  }
  ]
};

// ─── Curated 12 home musicians ─────────────────────────────────────────
const HOME12 = [
  { id:'miles',     name:'Miles Davis',         era:'1945–91', inst:'Trumpet',  hook:'Re-invented jazz five times' },
  { id:'trane',     name:'John Coltrane',       era:'1955–67', inst:'Tenor sax', hook:'A Love Supreme' },
  { id:'monk',      name:'Thelonious Monk',     era:'1944–82', inst:'Piano',    hook:'The composer\'s composer' },
  { id:'mingus',    name:'Charles Mingus',      era:'1943–77', inst:'Bass',     hook:'The Black Saint…' },
  { id:'evans',     name:'Bill Evans',          era:'1950–80', inst:'Piano',    hook:'At the Village Vanguard' },
  { id:'blakey',    name:'Art Blakey',          era:'1944–90', inst:'Drums',    hook:'The Jazz Messengers school' },
  { id:'rollins',   name:'Sonny Rollins',       era:'1949–...',inst:'Tenor sax', hook:'Saxophone Colossus' },
  { id:'cannonball',name:'Cannonball Adderley', era:'1955–75', inst:'Alto sax', hook:'Mercy, Mercy, Mercy' },
  { id:'hancock',   name:'Herbie Hancock',      era:'1960–...',inst:'Piano',    hook:'Maiden Voyage' },
  { id:'shorter',   name:'Wayne Shorter',       era:'1959–23', inst:'Tenor sax', hook:'Speak No Evil' },
  { id:'mccoy',     name:'McCoy Tyner',         era:'1960–20', inst:'Piano',    hook:'The Real McCoy' },
  { id:'timmons',   name:'Bobby Timmons',       era:'1956–74', inst:'Piano',    hook:"Moanin'" }
];

// ─── Journey modes (Start a journey panel) ─────────────────────────────
const JOURNEYS = [
  { id:'random',  label:'Random jump',  blurb:'Drop into any musician',    icon:'⚄' },
  { id:'era',     label:'Era walk',     blurb:'Step through the 1950s',     icon:'≡' },
  { id:'label',   label:'Label walk',   blurb:'Follow the Blue Note story', icon:'⌘' }
];

// ─── Relationship group labels (for D2) ────────────────────────────────
const GROUPS = {
  sameband: { label: 'In the same band',     blurb: 'Recorded together as part of a working unit' },
  frequent: { label: 'Frequent collaborator',blurb: 'Multiple sessions over years' },
  sameera:  { label: 'From the same era',    blurb: 'Contemporaries who crossed paths' },
  mentor:   { label: 'Mentored by',          blurb: 'Earlier bandleader or teacher' },
  mentored: { label: 'Mentored',             blurb: 'Players he sent into the world' },
  crossera: { label: 'Across eras',          blurb: 'Bridge-builders to next-generation players' }
};

Object.assign(window, { BOBBY2, MILES2, HOME12, JOURNEYS, GROUPS });
