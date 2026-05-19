// Jazzlore Musicians · Pass 4 data.
// Extends pass-3 musicians with the long tail required by the density-tier
// rail, plus a `photo` flag (false → mosaic + rail use centered initials
// as the primary identifier).

// Helper: shallow-clone a pass-3 musician and bolt on tail + photo flags
function withTail(m, tail) {
  return {
    ...m,
    // Mark headline collaborators as having photo data on file
    rail: m.rail.map(c => ({ ...c, photo: true })),
    tail,                          // dense list rendered after the headliners
    railMore: undefined            // pass 4 surfaces everything inline
  };
}

// ─── Miles — full long tail (~40 real collaborators) ──────────────────
const MILES4_TAIL = [
  { name: 'Jimmy Cobb',         inst: 'Drums',         top: { t: 'Kind of Blue',          y: 1959 }, count: 3, photo: true  },
  { name: 'Wynton Kelly',       inst: 'Piano',         top: { t: "Someday My Prince",     y: 1961 }, count: 3, photo: true  },
  { name: 'Bill Evans',         inst: 'Piano',         top: { t: 'Kind of Blue',          y: 1959 }, count: 2, photo: true  },
  { name: 'Hank Mobley',        inst: 'Tenor sax',     top: { t: "Someday My Prince",     y: 1961 }, count: 3, photo: true  },
  { name: 'Gil Evans',          inst: 'Arranger',      top: { t: 'Sketches of Spain',     y: 1960 }, count: 4, photo: true  },
  { name: 'George Coleman',     inst: 'Tenor sax',     top: { t: 'Seven Steps to Heaven', y: 1963 }, count: 2, photo: true  },
  { name: 'Sam Rivers',         inst: 'Tenor sax',     top: { t: 'Miles in Tokyo',        y: 1964 }, count: 1, photo: false },
  { name: 'Frank Foster',       inst: 'Tenor sax',     top: null,                                     count: 1, photo: false },
  { name: 'Sonny Stitt',        inst: 'Tenor sax',     top: { t: 'Live in Stockholm',     y: 1960 }, count: 1, photo: true  },
  { name: 'Steve Grossman',     inst: 'Soprano sax',   top: { t: 'Live-Evil',             y: 1971 }, count: 2, photo: false },
  { name: 'Gary Bartz',         inst: 'Alto sax',      top: { t: 'Live-Evil',             y: 1971 }, count: 2, photo: false },
  { name: 'Bennie Maupin',      inst: 'Bass clarinet', top: { t: 'Bitches Brew',          y: 1970 }, count: 2, photo: false },
  { name: 'Joe Zawinul',        inst: 'Keys',          top: { t: 'In a Silent Way',       y: 1969 }, count: 3, photo: true  },
  { name: 'John McLaughlin',    inst: 'Guitar',        top: { t: 'Bitches Brew',          y: 1970 }, count: 4, photo: true  },
  { name: 'Chick Corea',        inst: 'Keys',          top: { t: 'Bitches Brew',          y: 1970 }, count: 4, photo: true  },
  { name: 'Keith Jarrett',      inst: 'Keys',          top: { t: 'Live-Evil',             y: 1971 }, count: 3, photo: true  },
  { name: 'Dave Holland',       inst: 'Bass',          top: { t: 'In a Silent Way',       y: 1969 }, count: 4, photo: true  },
  { name: 'Michael Henderson',  inst: 'Bass',          top: { t: 'Live-Evil',             y: 1971 }, count: 4, photo: false },
  { name: 'Larry Young',        inst: 'Organ',         top: { t: 'Bitches Brew',          y: 1970 }, count: 1, photo: false },
  { name: 'Bennie Wallace',     inst: 'Tenor sax',     top: null,                                     count: 1, photo: false },
  { name: 'Jack DeJohnette',    inst: 'Drums',         top: { t: 'Bitches Brew',          y: 1970 }, count: 4, photo: true  },
  { name: 'Lenny White',        inst: 'Drums',         top: { t: 'Bitches Brew',          y: 1970 }, count: 1, photo: true  },
  { name: 'Al Foster',          inst: 'Drums',         top: { t: 'We Want Miles',         y: 1982 }, count: 5, photo: true  },
  { name: 'Airto Moreira',      inst: 'Percussion',    top: { t: 'Bitches Brew',          y: 1970 }, count: 2, photo: true  },
  { name: 'Don Alias',          inst: 'Percussion',    top: { t: 'Bitches Brew',          y: 1970 }, count: 2, photo: false },
  { name: 'Mtume',              inst: 'Percussion',    top: { t: 'On the Corner',         y: 1972 }, count: 3, photo: false },
  { name: 'Pete Cosey',         inst: 'Guitar',        top: { t: 'Agharta',               y: 1975 }, count: 2, photo: false },
  { name: 'Reggie Lucas',       inst: 'Guitar',        top: { t: 'Get Up With It',        y: 1974 }, count: 2, photo: false },
  { name: 'Dominique Gaumont',  inst: 'Guitar',        top: { t: 'Dark Magus',            y: 1974 }, count: 1, photo: false },
  { name: 'Marcus Miller',      inst: 'Bass',          top: { t: 'Tutu',                  y: 1986 }, count: 3, photo: true  },
  { name: 'Bob Berg',           inst: 'Tenor sax',     top: { t: 'Decoy',                 y: 1984 }, count: 2, photo: false },
  { name: 'Mike Stern',         inst: 'Guitar',        top: { t: 'We Want Miles',         y: 1982 }, count: 2, photo: true  },
  { name: 'John Scofield',      inst: 'Guitar',        top: { t: 'Decoy',                 y: 1984 }, count: 2, photo: true  },
  { name: 'Daryl Jones',        inst: 'Bass',          top: { t: 'Decoy',                 y: 1984 }, count: 2, photo: false },
  { name: 'Kenny Garrett',      inst: 'Alto sax',      top: { t: 'Amandla',               y: 1989 }, count: 2, photo: true  },
  { name: 'Lee Konitz',         inst: 'Alto sax',      top: { t: 'Birth of the Cool',     y: 1957 }, count: 1, photo: true  },
  { name: 'Gerry Mulligan',     inst: 'Bari sax',      top: { t: 'Birth of the Cool',     y: 1957 }, count: 1, photo: true  },
  { name: 'Kenny Clarke',       inst: 'Drums',         top: { t: 'Birth of the Cool',     y: 1957 }, count: 2, photo: true  },
  { name: 'John Lewis',         inst: 'Piano',         top: { t: 'Birth of the Cool',     y: 1957 }, count: 1, photo: true  },
  { name: 'J.J. Johnson',       inst: 'Trombone',      top: { t: 'Blue Period',           y: 1953 }, count: 2, photo: true  },
  { name: 'Sonny Rollins',      inst: 'Tenor sax',     top: { t: "Bags' Groove",          y: 1954 }, count: 3, photo: true  },
  { name: 'Milt Jackson',       inst: 'Vibes',         top: { t: "Bags' Groove",          y: 1954 }, count: 1, photo: true  },
  { name: 'Thelonious Monk',    inst: 'Piano',         top: { t: "Bags' Groove",          y: 1954 }, count: 1, photo: true  },
  { name: 'Percy Heath',        inst: 'Bass',          top: { t: "Bags' Groove",          y: 1954 }, count: 1, photo: false },
  { name: 'Jackie McLean',      inst: 'Alto sax',      top: { t: 'Dig',                   y: 1951 }, count: 1, photo: true  },
  { name: 'Foley',              inst: 'Lead bass',     top: { t: 'Amandla',               y: 1989 }, count: 2, photo: false },
  { name: 'David Sanborn',      inst: 'Alto sax',      top: { t: 'Tutu',                  y: 1986 }, count: 1, photo: true  }
];

// Extend Bobby's headliners with photo flag, no tail (he genuinely has only ~10)
const BOBBY4_TAIL = [
  { name: 'Sonny Clark',     inst: 'Piano',     top: null, count: 1, photo: true,  rel: 'Brief shared session at Riverside' },
  { name: 'Curtis Fuller',   inst: 'Trombone',  top: { t: 'Off to the Races', y: 1959 }, count: 1, photo: true },
  { name: 'Wynton Kelly',    inst: 'Piano',     top: null, count: 1, photo: true  },
  { name: 'Jimmy Heath',     inst: 'Tenor sax', top: null, count: 1, photo: true  },
  { name: 'Albert Heath',    inst: 'Drums',     top: null, count: 1, photo: false }
];

// Antoine — sparse: rail unchanged; tail empty by design; photos missing.
const ANTOINE4 = {
  ...ANTOINE3,
  rail: ANTOINE3.rail.map(c => ({ ...c, photo: false })),
  tail: [],
};

const MILES4 = withTail(MILES3, MILES4_TAIL);
const BOBBY4 = withTail(BOBBY3, BOBBY4_TAIL);

// ─── Image attribution copy ───────────────────────────────────────────
const ATTR_SAMPLES = {
  musician: {
    line1: 'Photograph · Francis Wolff for Blue Note Records, August 1958.',
    line2: 'Used under Wikimedia Commons (CC BY-SA 4.0). Cropped for layout.'
  },
  album: {
    line1: 'Cover art · Reid Miles for Blue Note (BLP 4003), 1959.',
    line2: 'Fair-use thumbnail · sourced from MusicBrainz cover-art archive.'
  }
};

// ─── Confirmations write-up ───────────────────────────────────────────
const CONFIRMATIONS = [
  {
    n: 1,
    title: 'Graph layout stability — deterministic radial.',
    body: 'Selected musician at centre. Three concentric rings by tier: count ≥ 7 inner (r=130), 3–6 middle (r=200), 1–2 outer (r=260). Each musician\'s angle is computed from a stable string hash of their name and frozen across re-centres. Net: John Coltrane always sits at the same clock-position relative to whoever is at centre. No jitter on re-centre — animations are pure circle-to-circle re-projection, not a physics solve.'
  },
  {
    n: 2,
    title: 'Mobile search affordance — visible bar, ⌘K is bonus.',
    body: 'The mobile home already carries a full-width search bar with magnifying glass icon and "Search a musician…" placeholder under the hero. ⌘K is shown on its right as a hint for desktop users hitting the same page, not as the primary handle. Tap target is 42 px tall. Pass-4 mocks make this more visually prominent.'
  },
  {
    n: 3,
    title: 'Image attribution — explicit, magazine-style.',
    body: 'Every musician portrait and every album cover renders a two-line caption directly beneath: line 1 photographer / source, line 2 licence + crop note. Pass-4 mocks show this on both a musician hero (Bobby) and an album cover (Moanin\'). When licensing is fair-use only, the caption says so. When data is missing, the caption is replaced by an italic "no portrait on file" placeholder, never silently omitted.'
  }
];

Object.assign(window, { MILES4, BOBBY4, ANTOINE4, MILES4_TAIL, BOBBY4_TAIL, ATTR_SAMPLES, CONFIRMATIONS });
