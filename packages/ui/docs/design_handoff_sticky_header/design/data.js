// Jazzlore content data — derived from screenshots.

// Each chord: id, short, long, notes (relative to C), intervals.
// "notes" is just labels for display; "semis" is semitones-from-root for keyboard rendering.
window.JL_CHORDS = [
  { id: "maj",     short: "C",      long: "major",             notes: "C E G",         intervals: "1 3 5",       semis: [0,4,7] },
  { id: "m",       short: "Cm",     long: "minor",             notes: "C E\u266d G",   intervals: "1 \u266d3 5", semis: [0,3,7] },
  { id: "dim",     short: "Cdim",   long: "diminished",        notes: "C E\u266d G\u266d", intervals: "1 \u266d3 \u266d5", semis: [0,3,6] },
  { id: "aug",     short: "Caug",   long: "augmented",         notes: "C E G\u266f", intervals: "1 3 \u266f5", semis: [0,4,8] },
  { id: "sus2",    short: "Csus2",  long: "suspended 2nd",     notes: "C D G",         intervals: "1 2 5",       semis: [0,2,7] },
  { id: "sus4",    short: "Csus4",  long: "suspended 4th",     notes: "C F G",         intervals: "1 4 5",       semis: [0,5,7] },
  { id: "6",       short: "C6",     long: "major 6th",         notes: "C E G A",       intervals: "1 3 5 6",     semis: [0,4,7,9] },
  { id: "m6",      short: "Cm6",    long: "minor 6th",         notes: "C E\u266d G A", intervals: "1 \u266d3 5 6", semis: [0,3,7,9] },
  { id: "69",      short: "C6/9",   long: "six-nine",          notes: "C E G A D",     intervals: "1 3 5 6 9",   semis: [0,4,7,9,14] },
  { id: "maj7",    short: "Cmaj7",  long: "major 7th",         notes: "C E G B",       intervals: "1 3 5 7",     semis: [0,4,7,11] },
  { id: "m7",      short: "Cm7",    long: "minor 7th",         notes: "C E\u266d G B\u266d", intervals: "1 \u266d3 5 \u266d7", semis: [0,3,7,10] },
  { id: "7",       short: "C7",     long: "dominant 7th",      notes: "C E G B\u266d", intervals: "1 3 5 \u266d7", semis: [0,4,7,10] },
  { id: "m7b5",    short: "Cm7\u266d5", long: "half-diminished 7th", notes: "C E\u266d G\u266d B\u266d", intervals: "1 \u266d3 \u266d5 \u266d7", semis: [0,3,6,10] },
  { id: "dim7",    short: "Cdim7",  long: "diminished 7th",    notes: "C E\u266d G\u266d B\u{1D12B}", intervals: "1 \u266d3 \u266d5 \u266d\u266d7", semis: [0,3,6,9] },
  { id: "mMaj7",   short: "CmMaj7", long: "minor-major 7th",   notes: "C E\u266d G B", intervals: "1 \u266d3 5 7", semis: [0,3,7,11] },
  { id: "maj9",    short: "Cmaj9",  long: "major 9th",         notes: "C E G B D",     intervals: "1 3 5 7 9",   semis: [0,4,7,11,14] },
  { id: "m9",      short: "Cm9",    long: "minor 9th",         notes: "C E\u266d G B\u266d D", intervals: "1 \u266d3 5 \u266d7 9", semis: [0,3,7,10,14] },
  { id: "9",       short: "C9",     long: "dominant 9th",      notes: "C E G B\u266d D", intervals: "1 3 5 \u266d7 9", semis: [0,4,7,10,14] },
  { id: "7b9",     short: "C7\u266d9", long: "dominant 7\u266d9", notes: "C E G B\u266d D\u266d", intervals: "1 3 5 \u266d7 \u266d9", semis: [0,4,7,10,13] },
  { id: "7#9",     short: "C7\u266f9", long: "dominant 7\u266f9", notes: "C E G B\u266d D\u266f", intervals: "1 3 5 \u266d7 \u266f9", semis: [0,4,7,10,15] },
  { id: "m11",     short: "Cm11",   long: "minor 11th",        notes: "C E\u266d G B\u266d D F", intervals: "1 \u266d3 5 \u266d7 9 11", semis: [0,3,7,10,14,17] },
  { id: "maj7#11", short: "Cmaj7\u266f11", long: "Lydian major 7", notes: "C E G B F\u266f", intervals: "1 3 5 7 \u266f11", semis: [0,4,7,11,18] },
  { id: "7#11",    short: "C7\u266f11", long: "Lydian dominant", notes: "C E G B\u266d F\u266f", intervals: "1 3 5 \u266d7 \u266f11", semis: [0,4,7,10,18] },
  { id: "maj13",   short: "Cmaj13", long: "major 13th",        notes: "C E G B D A",   intervals: "1 3 5 7 9 13", semis: [0,4,7,11,14,21] },
  { id: "13",      short: "C13",    long: "dominant 13th",     notes: "C E G B\u266d D A", intervals: "1 3 5 \u266d7 9 13", semis: [0,4,7,10,14,21] },
  { id: "7b13",    short: "C7\u266d13", long: "dominant 7\u266d13", notes: "C E G B\u266d D\u266d A\u266d", intervals: "1 3 5 \u266d7 \u266d9 \u266d13", semis: [0,4,7,10,13,20] },
  { id: "alt",     short: "C7alt",  long: "altered dominant",  notes: "C E F\u266f B\u266d D\u266d D\u266f A\u266d", intervals: "1 3 \u266f11 \u266d7 \u266d9 \u266f9 \u266d13", semis: [0,4,6,10,13,15,20] },
];

// Chord category groupings for chip-row UI
window.JL_CHORD_GROUPS = [
  { label: "Triads",      ids: ["maj","m","dim","aug","sus2","sus4"] },
  { label: "Sixths",      ids: ["6","m6","69"] },
  { label: "Sevenths",    ids: ["maj7","m7","7","m7b5","dim7","mMaj7"] },
  { label: "Ninths",      ids: ["maj9","m9","9","7b9","7#9"] },
  { label: "Extended",    ids: ["m11","maj7#11","7#11","maj13","13"] },
  { label: "Altered",     ids: ["7b13","alt"] },
];

window.JL_SCALE_GROUPS = [
  {
    id: "major", label: "Modes of major", expanded: true,
    scales: [
      { id: "ionian",     name: "Ionian",     aka: "Major",        notes: "C D E F G A B",                                  intervals: "1 2 3 4 5 6 7",                                  semis: [0,2,4,5,7,9,11] },
      { id: "dorian",     name: "Dorian",     aka: "",             notes: "C D E\u266d F G A B\u266d",                       intervals: "1 2 \u266d3 4 5 6 \u266d7",                       semis: [0,2,3,5,7,9,10] },
      { id: "phrygian",   name: "Phrygian",   aka: "",             notes: "C D\u266d E\u266d F G A\u266d B\u266d",           intervals: "1 \u266d2 \u266d3 4 5 \u266d6 \u266d7",           semis: [0,1,3,5,7,8,10] },
      { id: "lydian",     name: "Lydian",     aka: "",             notes: "C D E F\u266f G A B",                              intervals: "1 2 3 \u266f4 5 6 7",                             semis: [0,2,4,6,7,9,11] },
      { id: "mixolydian", name: "Mixolydian", aka: "",             notes: "C D E F G A B\u266d",                              intervals: "1 2 3 4 5 6 \u266d7",                             semis: [0,2,4,5,7,9,10] },
      { id: "aeolian",    name: "Aeolian",    aka: "Natural minor", notes: "C D E\u266d F G A\u266d B\u266d",                 intervals: "1 2 \u266d3 4 5 \u266d6 \u266d7",                 semis: [0,2,3,5,7,8,10] },
      { id: "locrian",    name: "Locrian",    aka: "",             notes: "C D\u266d E\u266d F G\u266d A\u266d B\u266d",     intervals: "1 \u266d2 \u266d3 4 \u266d5 \u266d6 \u266d7",     semis: [0,1,3,5,6,8,10] },
    ],
  },
  { id: "mmin", label: "Modes of melodic minor", expanded: false, count: 7, scales: [] },
  { id: "hmin", label: "Modes of harmonic minor", expanded: false, count: 7, scales: [] },
  { id: "sym",  label: "Symmetric", expanded: false, count: 3, scales: [] },
  { id: "pent", label: "Pentatonic & blues", expanded: false, count: 4, scales: [] },
  { id: "bebop", label: "Bebop", expanded: false, count: 4, scales: [] },
  { id: "exo",  label: "Exotic", expanded: false, count: 6, scales: [] },
];

// Root note buttons (matches screenshots: C, Db/C#, D, Eb/D#, E, F, F#/Gb, G, Ab/G#, A, Bb/A#, B)
window.JL_ROOTS = [
  { label: "C",          enharmonic: null },
  { label: "D\u266d",    enharmonic: "C\u266f" },
  { label: "D",          enharmonic: null },
  { label: "E\u266d",    enharmonic: "D\u266f" },
  { label: "E",          enharmonic: null },
  { label: "F",          enharmonic: null },
  { label: "F\u266f",    enharmonic: "G\u266d" },
  { label: "G",          enharmonic: null },
  { label: "A\u266d",    enharmonic: "G\u266f" },
  { label: "A",          enharmonic: null },
  { label: "B\u266d",    enharmonic: "A\u266f" },
  { label: "B",          enharmonic: null },
];
