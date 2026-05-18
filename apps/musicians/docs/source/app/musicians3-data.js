// Jazzlore Musicians · Pass 3 (convergence) data.
// Adds: Antoine (sparse), sameEra arrays for the serendipity section,
// autosuggest hits, and graph-layout positions for desktop.

// ─── Bobby Timmons (converged) ─────────────────────────────────────────
const BOBBY3 = {
  id: 'bobby-timmons',
  name: 'Bobby Timmons',
  era: 'Hard bop',
  years: '1956 – 1974',
  primary: 'Piano',
  birth: { date: 'Dec 19, 1935', place: 'Philadelphia, PA' },
  death: { date: 'Mar 1, 1974', place: 'New York, NY', age: 38 },
  bioLine:
    "Pianist and composer whose hymn-tinged blues gave hard bop its soul — \"Moanin'\", \"Dat Dere\", \"This Here\" all his, all standards before he turned twenty-five.",
  bioFull: [
    "Pianist and composer whose hymn-tinged blues gave hard bop its soul. \"Moanin'\", \"Dat Dere\", and \"This Here\" were all his and all standards before he turned twenty-five — first recorded with Art Blakey's Jazz Messengers, then again with the Cannonball Adderley Quintet that he joined the next year.",
    "Timmons grew up in a deeply religious Black family in North Philadelphia — his grandfather a minister, his father a sometime preacher. The church's harmonic language is audible in everything he wrote: the funk in his comping is not stylistic, it is the music he grew up inside.",
    "He led a handful of trio sessions for Riverside and Prestige between 1960 and 1968. Critics admired them; the audience that bought \"Moanin'\" did not follow. Alcoholism took the career, then the life; he died in 1974, aged 38."
  ],
  // Main rail — ranked by collaboration strength
  rail: [
    { name: 'Art Blakey',          inst: 'Drums',     top: { t: "Moanin'",            y: 1958 }, count: 7, rel: 'Bandleader · Jazz Messengers, 1958–60' },
    { name: 'Cannonball Adderley', inst: 'Alto sax',  top: { t: 'In San Francisco',   y: 1959 }, count: 5, rel: 'Bandleader · Adderley Quintet, 1959–60' },
    { name: 'Lee Morgan',          inst: 'Trumpet',   top: { t: "Moanin'",            y: 1958 }, count: 4, rel: 'Messengers frontline, 1958–60' },
    { name: 'Sam Jones',           inst: 'Bass',      top: { t: 'In San Francisco',   y: 1959 }, count: 4, rel: 'Adderley rhythm section' },
    { name: 'Benny Golson',        inst: 'Tenor sax', top: { t: "Moanin'",            y: 1958 }, count: 3, rel: 'Messengers frontline, 1958' },
    { name: 'Wayne Shorter',       inst: 'Tenor sax', top: { t: 'A Night in Tunisia', y: 1960 }, count: 3, rel: 'Messengers frontline, 1960' },
    { name: 'Jymie Merritt',       inst: 'Bass',      top: { t: "Moanin'",            y: 1958 }, count: 3, rel: 'Messengers rhythm section' },
    { name: 'Louis Hayes',         inst: 'Drums',     top: { t: 'In San Francisco',   y: 1959 }, count: 3, rel: 'Adderley rhythm section' },
    { name: 'Nat Adderley',        inst: 'Cornet',    top: { t: 'At the Lighthouse',  y: 1960 }, count: 3, rel: 'Adderley frontline' }
  ],
  sameEra: [
    { name: 'Horace Silver',    inst: 'Piano',     hint: 'Predecessor at the Messengers piano chair' },
    { name: 'Wynton Kelly',     inst: 'Piano',     hint: 'Contemporary, parallel hard-bop trios' },
    { name: 'Tommy Flanagan',   inst: 'Piano',     hint: 'Same year, same idiom — never recorded together' },
    { name: 'Hampton Hawes',    inst: 'Piano',     hint: 'West-coast counterpart, same generation' },
    { name: 'Junior Mance',     inst: 'Piano',     hint: 'Adderley before Bobby — direct lineage' },
    { name: 'Sonny Clark',      inst: 'Piano',     hint: 'Blue Note contemporary, similar feel' }
  ],
  records: [
    { t: "Moanin'",                                          a: 'Art Blakey & the Jazz Messengers',  y: 1959, label: 'Blue Note', cat: 'BLP 4003' },
    { t: 'The Cannonball Adderley Quintet in San Francisco', a: 'Cannonball Adderley Quintet',       y: 1959, label: 'Riverside', cat: 'RLP 12-311' },
    { t: 'This Here Is Bobby Timmons',                       a: 'Bobby Timmons',                     y: 1960, label: 'Riverside', cat: 'RLP 12-317' },
    { t: 'A Night in Tunisia',                               a: 'Art Blakey & the Jazz Messengers',  y: 1961, label: 'Blue Note', cat: 'BLP 4049' },
    { t: 'The Big Beat',                                     a: 'Art Blakey & the Jazz Messengers',  y: 1960, label: 'Blue Note', cat: 'BLP 4029' },
    { t: 'Soul Time',                                        a: 'Bobby Timmons',                     y: 1960, label: 'Riverside', cat: 'RLP 12-334' }
  ]
};

// ─── Miles Davis (converged) ───────────────────────────────────────────
const MILES3 = {
  id: 'miles-davis',
  name: 'Miles Davis',
  era: 'Cool · Modal · Fusion',
  years: '1945 – 1991',
  primary: 'Trumpet',
  birth: { date: 'May 26, 1926', place: 'Alton, IL' },
  death: { date: 'Sep 28, 1991', place: 'Santa Monica, CA', age: 65 },
  bioLine:
    "Trumpeter who redrew jazz's territory at least five times — bebop, cool, hard bop, modal, fusion — and built each new band from the players he then made famous.",
  bioFull: [
    "Trumpeter who redrew jazz's territory at least five times — bebop with Parker, the cool nonet, the marathon hard-bop quintet, the modal experiments of Kind of Blue, the second-quintet abstraction, and the electric fusion of Bitches Brew.",
    "A bandleader whose ear was the engine: every record is also the launch of a player. Coltrane, Cannonball, Bill Evans, Wayne Shorter, Tony Williams, Herbie Hancock, Joe Zawinul, John McLaughlin — each first heard properly through Miles."
  ],
  rail: [
    { name: 'John Coltrane',      inst: 'Tenor sax', top: { t: 'Kind of Blue',         y: 1959 }, count: 12, rel: 'First Great Quintet, 1955–60' },
    { name: 'Ron Carter',         inst: 'Bass',      top: { t: 'E.S.P.',               y: 1965 }, count: 12, rel: 'Second Great Quintet, 1964–68' },
    { name: 'Philly Joe Jones',   inst: 'Drums',     top: { t: "Round About Midnight", y: 1957 }, count: 12, rel: 'First Quintet rhythm section' },
    { name: 'Wayne Shorter',      inst: 'Tenor sax', top: { t: 'Nefertiti',            y: 1968 }, count: 11, rel: 'Second Great Quintet' },
    { name: 'Paul Chambers',      inst: 'Bass',      top: { t: 'Kind of Blue',         y: 1959 }, count: 22, rel: 'First Quintet rhythm — recorded most with Miles' },
    { name: 'Red Garland',        inst: 'Piano',     top: { t: "Round About Midnight", y: 1957 }, count: 11, rel: 'First Quintet rhythm section' },
    { name: 'Herbie Hancock',     inst: 'Piano',     top: { t: 'Miles Smiles',         y: 1967 }, count:  9, rel: 'Second Great Quintet' },
    { name: 'Tony Williams',      inst: 'Drums',     top: { t: 'Miles Smiles',         y: 1967 }, count:  9, rel: 'Second Great Quintet — joined at 17' },
    { name: 'Cannonball Adderley',inst: 'Alto sax',  top: { t: 'Kind of Blue',         y: 1959 }, count:  4, rel: 'Sextet frontline, 1958–59' }
  ],
  // "see all" hidden ones — implied count, surfaces in the rail's overflow
  railMore: 7,
  sameEra: [
    { name: 'Dizzy Gillespie',    inst: 'Trumpet', hint: 'The bebop generation he stepped past' },
    { name: 'Charles Mingus',     inst: 'Bass',    hint: 'Contemporary, parallel composer-bandleader' },
    { name: 'Ornette Coleman',    inst: 'Alto sax', hint: 'Free jazz Miles publicly disliked' },
    { name: 'Thelonious Monk',    inst: 'Piano',   hint: 'Briefly recorded together, 1954' },
    { name: 'Sonny Rollins',      inst: 'Tenor sax', hint: 'Played with Miles before Trane did' },
    { name: 'Clifford Brown',     inst: 'Trumpet', hint: 'The trumpeter Miles measured himself against' }
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

// ─── Antoine Hervé (sparse-state musician) ─────────────────────────────
const ANTOINE3 = {
  id: 'antoine-herve',
  name: 'Antoine Hervé',
  era: 'Contemporary',
  years: '1980 – present',
  primary: 'Piano',
  birth: { date: 'May 23, 1959', place: 'Saint-Mandé, France' },
  death: null,
  bioLine: null,
  bioFull: null,
  bioNote: 'French pianist and composer. Directed the Orchestre National de Jazz, 1987–89. We hold limited data — help us improve.',
  rail: [
    { name: 'Didier Lockwood', inst: 'Violin',  top: { t: 'ONJ session', y: 1989 }, count: 1, rel: 'One shared session, ONJ era' },
    { name: 'Eric Le Lann',    inst: 'Trumpet', top: null,                            count: 1, rel: 'One shared session, c.1988' }
  ],
  sameEra: [
    { name: 'Martial Solal',    inst: 'Piano', hint: 'French pianist — possible connection' },
    { name: 'Michel Petrucciani',inst: 'Piano', hint: 'Same generation, same scene' },
    { name: 'Bojan Z',          inst: 'Piano', hint: 'Contemporary French pianist' }
  ],
  records: [
    { t: 'Orchestre National de Jazz 1989', a: 'ONJ / Antoine Hervé', y: 1989, label: 'Label Bleu', cat: '—' },
    { t: 'Live in Paris',                   a: 'Antoine Hervé Trio',  y: 2003, label: 'Naïve',      cat: '—' }
  ],
  duplicate: true,
  duplicateNote: 'Possibly the same person as another entry. Help us merge.'
};

// ─── Autosuggest sample hits (for the dropdown screen) ────────────────
// "antoi" → Antoine Hervé via name; "trane" → Coltrane via aka.
// Accent-fold: "herve" also matches "Hervé".
const SUGGEST_HITS = {
  query: 'antoi',
  hits: [
    { name: 'Antoine Hervé',     inst: 'Piano',    era: '1980–...', tag: 'name match',           id: 'antoine-herve' },
    { name: 'Antoine Roney',     inst: 'Saxophone',era: '1985–...', tag: 'name match',           id: 'antoine-roney' },
    { name: 'Antônio Carlos Jobim', inst: 'Piano', era: '1956–94', tag: 'accent-folded · "Antoi"', id: 'tom-jobim' },
    { name: 'Anthony Braxton',   inst: 'Saxophone',era: '1968–...', tag: 'prefix · "An"',         id: 'a-braxton' },
    { name: 'Antoine Berjeaut',  inst: 'Trumpet',  era: '2010–...', tag: 'name match',           id: 'a-berjeaut' }
  ],
  fallback: [
    { name: 'Miles Davis',  reason: 'Popular start' },
    { name: 'John Coltrane',reason: 'Popular start' },
    { name: 'Bill Evans',   reason: 'Popular start' }
  ]
};

// ─── Graph layout (positions for desktop graph view) ──────────────────
// Hand-placed coords so it reads like a force-directed network without
// running a real solver in the page. Coordinates are in a 600×500 viewBox.
const MILES_GRAPH = {
  center: { x: 300, y: 250, r: 40, name: 'Miles Davis' },
  nodes: [
    { x: 130, y: 130, r: 22, name: 'John Coltrane',    inst: 'Tenor', w: 12 },
    { x: 105, y: 230, r: 22, name: 'Paul Chambers',    inst: 'Bass',  w: 22 },
    { x: 130, y: 350, r: 20, name: 'Red Garland',      inst: 'Piano', w: 11 },
    { x: 210, y: 410, r: 20, name: 'Philly Joe Jones', inst: 'Drums', w: 12 },
    { x: 320, y: 440, r: 16, name: 'Bill Evans',       inst: 'Piano', w:  2 },
    { x: 430, y: 410, r: 18, name: 'Cannonball Adderley', inst:'Alto', w:4 },
    { x: 500, y: 330, r: 22, name: 'Wayne Shorter',    inst: 'Tenor', w: 11 },
    { x: 520, y: 230, r: 22, name: 'Ron Carter',       inst: 'Bass',  w: 12 },
    { x: 490, y: 140, r: 20, name: 'Herbie Hancock',   inst: 'Piano', w:  9 },
    { x: 410, y: 80,  r: 20, name: 'Tony Williams',    inst: 'Drums', w:  9 },
    { x: 290, y: 60,  r: 16, name: 'Gil Evans',        inst: 'Arr.',  w:  4 },
    { x: 200, y: 60,  r: 14, name: 'Joe Zawinul',      inst: 'Keys',  w:  3 },
    { x: 60,  y: 320, r: 14, name: 'John McLaughlin',  inst: 'Gtr',   w:  4 },
    { x: 530, y: 440, r: 14, name: 'Chick Corea',      inst: 'Keys',  w:  4 },
    { x: 50,  y: 180, r: 14, name: 'Hank Mobley',      inst: 'Tenor', w:  3 }
  ]
};
const BOBBY_GRAPH = {
  center: { x: 300, y: 250, r: 38, name: 'Bobby Timmons' },
  nodes: [
    { x: 160, y: 130, r: 26, name: 'Art Blakey',         inst: 'Drums',     w: 7 },
    { x: 460, y: 130, r: 24, name: 'Cannonball Adderley',inst: 'Alto',      w: 5 },
    { x: 110, y: 250, r: 22, name: 'Lee Morgan',         inst: 'Trumpet',   w: 4 },
    { x: 490, y: 250, r: 22, name: 'Sam Jones',          inst: 'Bass',      w: 4 },
    { x: 150, y: 380, r: 20, name: 'Benny Golson',       inst: 'Tenor',     w: 3 },
    { x: 250, y: 430, r: 20, name: 'Wayne Shorter',      inst: 'Tenor',     w: 3 },
    { x: 360, y: 430, r: 20, name: 'Jymie Merritt',      inst: 'Bass',      w: 3 },
    { x: 460, y: 380, r: 20, name: 'Louis Hayes',        inst: 'Drums',     w: 3 },
    { x: 540, y: 320, r: 20, name: 'Nat Adderley',       inst: 'Cornet',    w: 3 },
    { x: 60,  y: 320, r: 16, name: 'Ron Carter',         inst: 'Bass',      w: 2 }
  ]
};

// ─── Mosaic-tap reasoning (rendered on the canvas) ────────────────────
const MOSAIC_TAP_REASONING = {
  decision: 'Tap a mosaic tile → scroll to the matching card in the rail (with a soft highlight). The card itself is the navigation.',
  shortReason: 'The mosaic is a legend; the rail is the decision. Don\'t collapse them into one gesture.',
  pros: [
    'Preserves the product DNA — the user always sees the "why" (top record, count) before they navigate.',
    'Solves the abundance case — on Miles, the mosaic has 15+ tiles; tapping any of them blind would be punishing.',
    'Gives the orbit a job — it answers "who looms large?" without competing with the rail.',
    'Free undo — scrolling somewhere is reversible; navigating is a route change.'
  ],
  cons: [
    'Two-tap to navigate when one would do — feels heavier than Spotify.',
    'Users may not realize the tile maps to a card without a small motion cue.'
  ],
  mitigations: [
    'Tap target shows a brief 240ms highlight pulse on the destination card.',
    'On hover (desktop) the matching card lifts/outlines so the mapping is visible.',
    'Long-press tile = navigate directly, for users who already know.'
  ]
};

Object.assign(window, {
  BOBBY3, MILES3, ANTOINE3,
  SUGGEST_HITS, MILES_GRAPH, BOBBY_GRAPH,
  MOSAIC_TAP_REASONING
});
