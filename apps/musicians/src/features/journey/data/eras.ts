// ERA_DATA — 7 canonical jazz eras, chronological. Per the brainstorm
// decisions (2026-05-21), this is hand-curated in-repo data — no BFF
// dependency, no populator dependency. Each entry: ~10 musicians whose
// IDs were resolved against the live /api/musicians/search-index.
//
// Names that did not resolve in the live corpus were replaced with
// canonical adjacent figures (noted inline):
//   - Django Reinhardt → Stéphane Grappelli (Swing — QHCF partner)
//   - Albert Ayler     → Marion Brown       (Free — alto sax peer)
//   - Weather Report   → John McLaughlin    (Fusion — Mahavishnu founder)
//   - Mahavishnu Orch. → Billy Cobham       (Fusion — Mahavishnu drummer)

import type { JourneyEntry } from '../JourneyData'

const swing: JourneyEntry = {
  slug: 'swing',
  name: 'Swing',
  kicker: '— LATE 1920s INTO THE 40s · BIG BANDS RULE THE NIGHT',
  h1: 'Swing.',
  subtitle: 'America’s dance music, before the small-group revolution.',
  icon: '∿',
  musicians: [
    { id: 'wikidata:Q4030', name: 'Duke Ellington', hook: 'The architect — orchestrator of an American art form.' },
    { id: 'musicbrainz:0dbd6300-efdc-420b-857e-895e18fad317', name: 'Count Basie', hook: 'Kansas City swing — economy of notes, depth of groove.' },
    { id: 'wikidata:Q217812', name: 'Coleman Hawkins', hook: 'Father of the jazz tenor; “Body and Soul” the rosetta stone.' },
    { id: 'musicbrainz:d613e4ae-093a-49a1-b06a-579480f7f7e8', name: 'Lester Young', hook: 'Prez — laid-back tenor, the cool before there was Cool.' },
    { id: 'musicbrainz:54799c0e-eb45-4eea-996d-c4d71a63c499', name: 'Ella Fitzgerald', hook: 'Scat sovereignty, the songbook canonized.' },
    { id: 'wikidata:Q46755', name: 'Benny Goodman', hook: 'King of Swing — and Carnegie Hall’s first jazz visitor.' },
    { id: 'musicbrainz:d59c4cda-11d9-48db-8bfe-b557ee602aed', name: 'Billie Holiday', hook: 'Lady Day — phrasing as confession.' },
    { id: 'wikidata:Q109053', name: 'Art Tatum', hook: 'Piano as orchestra; speeds Cole Porter never heard.' },
    { id: 'wikidata:Q206244', name: 'Stéphane Grappelli', hook: 'Hot Club violin — Paris jazz with a French accent.' },
    { id: 'wikidata:Q376146', name: 'Roy Eldridge', hook: 'Little Jazz — the bridge between Armstrong and Diz.' },
  ],
}

const bebop: JourneyEntry = {
  slug: 'bebop',
  name: 'Bebop',
  kicker: '— MID-1940s INTO THE 50s · JAZZ TURNS VIRTUOSO',
  h1: 'Bebop.',
  subtitle: 'The small-group revolution led by Bird and Diz.',
  icon: '≡',
  musicians: [
    { id: 'wikidata:Q103767', name: 'Charlie Parker', hook: 'Bird — the alto that rewrote the rules of melody.' },
    { id: 'wikidata:Q49575', name: 'Dizzy Gillespie', hook: 'Bent horn, beret, mathematics of harmony.' },
    { id: 'wikidata:Q312692', name: 'Bud Powell', hook: 'Bebop piano made into a single right-hand voice.' },
    { id: 'wikidata:Q109612', name: 'Thelonious Monk', hook: 'The angular logic no one else heard — then everyone did.' },
    { id: 'wikidata:Q175899', name: 'Max Roach', hook: 'Re-tuned the drums into a melodic voice.' },
    { id: 'wikidata:Q346779', name: 'Kenny Clarke', hook: 'Klook — invented the ride-cymbal pulse that bebop runs on.' },
    { id: 'musicbrainz:cc1588e1-5ba3-45a6-b80c-b31035c89339', name: 'Dexter Gordon', hook: 'Long Tall Dexter — tenor with a laconic, late-night swagger.' },
    { id: 'wikidata:Q356490', name: 'Charlie Christian', hook: 'Electrified the guitar; one of bebop’s first prophets.' },
    { id: 'musicbrainz:d2a135f4-bb6b-4fb6-a09b-115e740b7fe0', name: 'Fats Navarro', hook: 'Trumpet brilliance cut short — Clifford Brown’s direct ancestor.' },
    { id: 'wikidata:Q502311', name: 'Sonny Stitt', hook: 'Bird’s heir on alto, then equally fluent on tenor.' },
  ],
}

const cool: JourneyEntry = {
  slug: 'cool',
  name: 'Cool',
  kicker: '— LATE 1940s INTO THE 50s · WEST COAST RESTRAINT',
  h1: 'Cool.',
  subtitle: 'Bebop slowed, softened, and re-orchestrated.',
  icon: '○',
  musicians: [
    { id: 'wikidata:Q93341', name: 'Miles Davis', hook: 'Birth of the Cool — the nonet that named the era.' },
    { id: 'wikidata:Q2274', name: 'Chet Baker', hook: 'Trumpet of porcelain; the voice of West Coast melancholy.' },
    { id: 'wikidata:Q156535', name: 'Gerry Mulligan', hook: 'Baritone sax with a feathered touch; the piano-less quartet.' },
    { id: 'wikidata:Q453393', name: 'Lee Konitz', hook: 'Tristano’s star alto — angularity without aggression.' },
    { id: 'wikidata:Q30587', name: 'Stan Getz', hook: 'The Sound — tenor saxophone’s most beloved tone.' },
    { id: 'wikidata:Q586994', name: 'Lennie Tristano', hook: 'The cerebral wing — cool as classroom and laboratory.' },
    { id: 'musicbrainz:de0222a6-e1c4-403d-8b01-3f66d505061b', name: 'Dave Brubeck', hook: 'Time Out — odd meters into the mainstream.' },
    { id: 'wikidata:Q332471', name: 'Paul Desmond', hook: 'Brubeck’s alto — “a dry martini.”' },
    { id: 'wikidata:Q722303', name: 'Shorty Rogers', hook: 'West Coast bandleader — the L.A. lieutenant of Cool.' },
    { id: 'wikidata:Q528103', name: 'Jimmy Giuffre', hook: 'Chamber jazz before the term existed.' },
  ],
}

const hardBop: JourneyEntry = {
  slug: 'hard-bop',
  name: 'Hard Bop',
  kicker: '— MID-1950s INTO THE 60s · JAZZ COMES BACK TO THE CHURCH',
  h1: 'Hard Bop.',
  subtitle: 'Bebop reignited with blues, gospel, and a hot rhythm section.',
  icon: '◆',
  musicians: [
    { id: 'wikidata:Q311715', name: 'Art Blakey', hook: 'Jazz Messengers — the university of hard-bop drumming.' },
    { id: 'wikidata:Q365560', name: 'Horace Silver', hook: 'Funky, churchy piano — the genre’s composer-in-chief.' },
    { id: 'wikidata:Q354490', name: 'Clifford Brown', hook: 'Brownie — trumpet warmth lost too soon.' },
    { id: 'wikidata:Q110477', name: 'Cannonball Adderley', hook: 'Alto with a grin — the populist gospel of hard bop.' },
    { id: 'wikidata:Q132341', name: 'Bobby Timmons', hook: '“Moanin’” — the soulful piano that defined a sound.' },
    { id: 'wikidata:Q362564', name: 'Lee Morgan', hook: 'The Sidewinder — hard bop’s breakout hit, on Blue Note.' },
    { id: 'wikidata:Q318948', name: 'Jimmy Smith', hook: 'Hammond B-3 as a full band — invented the organ trio.' },
    { id: 'wikidata:Q298601', name: 'Wes Montgomery', hook: 'Thumb-picked octaves — the architect of modern jazz guitar.' },
    { id: 'wikidata:Q317161', name: 'Wayne Shorter', hook: 'Composer-improviser — his pen reshaped the Messengers.' },
    { id: 'wikidata:Q506006', name: 'Joe Henderson', hook: 'Tenor of cool intelligence — Blue Note’s late-period anchor.' },
  ],
}

const modal: JourneyEntry = {
  slug: 'modal',
  name: 'Modal',
  kicker: '— LATE 1950s INTO THE 60s · CHORDS GIVE WAY TO SCALES',
  h1: 'Modal.',
  subtitle: 'Fewer chord changes, more space to roam.',
  icon: '△',
  musicians: [
    { id: 'wikidata:Q93341', name: 'Miles Davis', hook: 'Kind of Blue — the album that rebuilt the harmonic floor.' },
    { id: 'wikidata:Q7346', name: 'John Coltrane', hook: 'Spiritual ascent — sheets of sound into sheets of light.' },
    { id: 'wikidata:Q862106', name: 'Bill Evans', hook: 'Piano as inner monologue — the trio re-imagined.' },
    { id: 'wikidata:Q318619', name: 'McCoy Tyner', hook: 'Coltrane’s pianist — left-hand quartal foundations.' },
    { id: 'wikidata:Q105875', name: 'Herbie Hancock', hook: 'Miles’ second-great-quintet pianist; the harmonic adventurer.' },
    { id: 'wikidata:Q317161', name: 'Wayne Shorter', hook: 'The composer who made modal songs ambiguous on purpose.' },
    { id: 'wikidata:Q453604', name: 'Tony Williams', hook: 'Miles’ teenage prodigy on drums — elastic time.' },
    { id: 'wikidata:Q434593', name: 'Ron Carter', hook: 'The bassline that taught a generation how to walk.' },
    { id: 'wikidata:Q727702', name: 'Jimmy Garrison', hook: 'Coltrane’s bassist — the drone beneath A Love Supreme.' },
    { id: 'wikidata:Q367508', name: 'Eric Dolphy', hook: 'Multi-instrument iconoclast — modal’s outer edge.' },
  ],
}

const free: JourneyEntry = {
  slug: 'free',
  name: 'Free',
  kicker: '— LATE 1950s ONWARD · THE FORMS DISSOLVE',
  h1: 'Free.',
  subtitle: 'Jazz steps outside the chord chart — and the bar line.',
  icon: '✴',
  musicians: [
    { id: 'musicbrainz:169c0d1b-fcb8-4a43-9097-829aa7b39205', name: 'Ornette Coleman', hook: 'The Shape of Jazz to Come — melody without a chord.' },
    { id: 'wikidata:Q363908', name: 'Cecil Taylor', hook: 'Piano as percussion, as architecture, as weather system.' },
    { id: 'wikidata:Q1367166', name: 'Marion Brown', hook: 'Alto on Ascension — free-jazz with a lyrical heart.' },
    { id: 'wikidata:Q367508', name: 'Eric Dolphy', hook: 'Bass clarinet — the doorway from inside to outside.' },
    { id: 'wikidata:Q456180', name: 'Don Cherry', hook: 'Pocket trumpet, world-music ear — Ornette’s sideman first.' },
    { id: 'wikidata:Q470617', name: 'Pharoah Sanders', hook: 'Coltrane’s late-period tenor — prayer at full throttle.' },
    { id: 'musicbrainz:f86342be-eef7-445b-90c9-250bdf3f0b3b', name: 'Sam Rivers', hook: 'Loft jazz patriarch — saxophone, flute, free architecture.' },
    { id: 'wikidata:Q354508', name: 'Sun Ra', hook: 'Arkestra — cosmic jazz, costumes, and chromatic Saturn.' },
    { id: 'wikidata:Q572924', name: 'Anthony Braxton', hook: 'Composer-saxophonist of diagrams and density.' },
    { id: 'wikidata:Q1785499', name: 'Roscoe Mitchell', hook: 'Art Ensemble of Chicago — the AACM’s saxophone conscience.' },
  ],
}

const fusion: JourneyEntry = {
  slug: 'fusion',
  name: 'Fusion',
  kicker: '— LATE 1960s INTO THE 70s · JAZZ PLUGS IN',
  h1: 'Fusion.',
  subtitle: 'Electric instruments, rock energy, and a new vocabulary.',
  icon: '⚡',
  musicians: [
    { id: 'wikidata:Q93341', name: 'Miles Davis', hook: 'Bitches Brew — the album that crossed the wire.' },
    { id: 'wikidata:Q44767', name: 'Joe Zawinul', hook: 'Weather Report’s keyboard architect — from “In a Silent Way” on.' },
    { id: 'wikidata:Q317161', name: 'Wayne Shorter', hook: 'The other half of Weather Report — ECM-cool soprano.' },
    { id: 'wikidata:Q192465', name: 'Chick Corea', hook: 'Return to Forever — Latin fire on a Fender Rhodes.' },
    { id: 'wikidata:Q105875', name: 'Herbie Hancock', hook: 'Head Hunters — funk and Clavinet break into jazz prime time.' },
    { id: 'wikidata:Q164757', name: 'John McLaughlin', hook: 'Mahavishnu Orchestra — raga-velocity electric guitar.' },
    { id: 'wikidata:Q338786', name: 'Billy Cobham', hook: 'Mahavishnu’s drumming engine — rock fury, jazz hands.' },
    { id: 'musicbrainz:46a6fac0-2e14-4214-b08e-3bdb1cffa5aa', name: 'Jaco Pastorius', hook: 'Reinvented the electric bass as a melodic instrument.' },
    { id: 'wikidata:Q453406', name: 'Stanley Clarke', hook: 'Bass virtuoso of Return to Forever — slap, sing, soar.' },
    { id: 'wikidata:Q213887', name: 'Pat Metheny', hook: 'Heartland fusion — ECM lyricism into Grammy territory.' },
  ],
}

export const ERA_DATA: Record<string, JourneyEntry> = {
  swing,
  bebop,
  cool,
  'hard-bop': hardBop,
  modal,
  free,
  fusion,
}
