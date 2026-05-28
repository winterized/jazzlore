# Handoff · Musicians no-photo treatment

A dignified, designed treatment for the ~200+ musicians on musicians.jazzlore.com
who have **no free-licensed photograph** and never will (the image simply doesn't
exist under a reusable license — mostly sidemen).

Replaces today's broken-looking duotone tile with corner-initials with an
**editorial-line figure of the musician in the act of playing**, keyed off
their primary instrument, plus a small mono monogram in the bottom-right corner
to disambiguate musicians who share an instrument.

---

## About the design files

The files in `app/` are **production-ready** — direct drop-ins for the
existing Jazzlore Musicians codebase (pass-3 `.mu3` namespace). They are not
"design references created in HTML" — they are the actual JS + JSX + CSS
intended to ship. The `reference/` folder holds two HTML exploration pages
that demonstrate the system visually and serve as visual specs.

If your codebase has diverged from pass-3 `musicians3-shared.jsx` /
`musicians3-styles.css`, treat the `app/` files as **patches** to apply rather
than wholesale overwrites — the relevant edits are described file-by-file in
[Integration](#integration) below.

## Fidelity

**High-fidelity (hifi).** Pixel-perfect, production-wired. Final colors,
typography, spacing, stroke weights, and per-context scaling are all
specified and tested across all five tile sizes that `.duo3` appears at in
the existing layout (32 / 44 / 64 / 80 / 140 px).

---

## The system in one paragraph

Every musician's tile already passes through a `<Duo3 name="…"/>` primitive
that renders the stone+amber duotone field. We extend that primitive: when a
`inst` prop is supplied, instead of corner-initials, the tile renders an
**editorial single-line drawing of a figure playing that instrument**, plus
a small monogram in the corner. The figure is keyed off the instrument
string via a forgiving `figKey()` mapper (cornet → trumpet, hammond → organ,
etc.). For musicians whose primary instrument is unknown (~200 of them),
`figKey()` falls through to a **"figure at rest"** mark — same drawing
system, no instrument, with a small question-mark accent above the head.

---

## What's in this bundle

```
design_handoff_no_photo/
├── README.md                           ← you are here
├── app/
│   ├── no-photo-figures.js             ← NEW: figure library + helpers (production)
│   ├── musicians3-shared.jsx           ← MODIFIED: Duo3 + ConnRow + MosaicHeader + EraStrip
│   └── musicians3-styles.css           ← MODIFIED: adds .duo3-mark + per-context rules
└── reference/
    ├── v4-direction-pick.html          ← Exploration showing the chosen direction (line) vs alternatives
    └── v5-current.html                 ← Final spec: all 14 instruments, monogram, in-context demos
```

Open `reference/v5-current.html` in a browser to see the final intended look.

---

## Integration

Three production files. **Load order matters.**

### 1. `app/no-photo-figures.js` (NEW — drop in)

A plain JS module that defines the figure library and helpers. Exports to
`window`:

| Export | Purpose |
| --- | --- |
| `FIG_LIB` | `{ key → SVG inner markup }` for the 14 figures |
| `figKey(inst)` | Maps a free-form instrument string → figure key |
| `serialFor(name)` | Stable 3-digit serial derived from name (used by some marks) |
| `initialsOf(name)` | 1–2 character monogram (skips particles: van / de / of / the / …) |
| `NoPhotoMark({inst, name})` | React component — renders `<div.duo3-mark>` |

**Host HTML load order — must be loaded BEFORE `musicians3-shared.jsx`:**

```html
<script src="app/no-photo-figures.js"></script>
<script type="text/babel" src="app/musicians3-shared.jsx"></script>
```

Already added to the three musicians-exploration host pages
(`Jazzlore Musicians exploration v3/v4/v5.html`).

### 2. `app/musicians3-shared.jsx` (MODIFIED)

Three small edits:

- **`Duo3`** gains an `inst` prop. When present, renders
  `<NoPhotoMark inst={inst} name={name}/>` in place of the corner
  initials. When absent (or null), falls back to existing initials
  behaviour. `initials={false}` callers (record covers in `RecordsStrip`)
  are untouched.
- **`MosaicHeader`** passes `inst={c.inst}` on each `<Duo3>`.
- **`ConnRow`** passes `inst={c.inst}`.
- **`EraStrip`** passes `inst={c.inst}`.

No caller-side data changes needed — `c.inst` is already on every collab /
era-item in `musicians3-data.js`.

### 3. `app/musicians3-styles.css` (MODIFIED)

Two additions, both append-only — existing rules untouched.

- **Base `.duo3-mark` block** — positions the SVG overlay, sets base stroke
  weight 3, color via `color-mix(in srgb, var(--duo-hi) 82%, white)`, opacity
  0.96. Defines `.ln` / `.dot` / `.keyfill` SVG sub-rules. Also defines
  `.duo3-mark-ini` — the bottom-right monogram (Geist Mono, semibold).
- **Per-context overrides** — tunes stroke weight + padding + monogram size
  for every `.mu3` context that uses `.duo3`. See
  [Per-context sizing table](#per-context-sizing-table) below.

---

## The figure library

14 figures, drawn as single-weight stroked SVG paths in a `100 × 140` viewBox.
Each figure occupies the bottom-aligned area of the viewBox
(`preserveAspectRatio="xMidYMax meet"`).

| Key | Figure | Pose |
| --- | --- | --- |
| `piano` | Pianist (profile) | Seated, both arms reaching forward to a horizontal keyboard. Hair sweep + nose hint give the silhouette personality. |
| `trumpet` | Trumpeter | Standing, head tilted back, horn extending forward + slightly up. Bell flare + three valve dots. |
| `trombone` | Trombonist | Standing facing right. Slide extends horizontally forward; bell behind player on the left. |
| `sax` | Saxophonist | Standing, sax body in a J-curve from mouth down to right hip. Bell flares right. Key dots down the body. |
| `clarinet` | Clarinetist | Standing, clarinet held vertically from mouth to bell at navel. Both hands stacked on instrument. Key dots down the body. |
| `flute` | Flautist | Standing, flute held horizontal across face. Mouthpiece at left; key dots run right. |
| `bass` | Upright bassist | Standing tall on the left; large rounded upright bass to the right with scroll, tuning pegs, f-holes, bridge. Player's arms wrap around the neck and reach for the bridge. |
| `violin` | Violinist | Standing, head tilted toward shoulder, violin body angled across chest with scroll right of figure, bow horizontal. |
| `guitar` | Guitarist (3/4, seated) | Guitar body diagonal across lap, neck extending up-right with headstock + tuners. Fretting hand high on neck, strumming hand near sound hole. |
| `drums` | Drummer | Seated, both arms raised diagonally with sticks. Snare drum in front (with lugs). Cymbal stand top-right, hi-hat left. |
| `vibes` | Vibraphonist | Standing, both arms forward holding mallets pointing down at a horizontal bar of vibe bars. |
| `organ` | Organist (Hammond) | Like piano figure but with **two** stacked keyboards (upper + lower manual) + drawbar strip on top of the console. |
| `voice` | Vocalist | Standing, one arm raised holding a microphone capsule angled toward the face. |
| `rest` | Figure at rest (unknown) | Standing, arms folded across body. **Small question-mark accent above the head** — discreet, signals "instrument unknown". |

### `figKey(inst)` — string mapping

Case-insensitive, substring match. **Unknown strings → `'rest'`**. Order
matters (more specific keys checked first).

| `figKey` returns | …for any input string containing |
| --- | --- |
| `piano` | piano, electric piano, rhodes, wurlitzer, keyboard, keys |
| `organ` | organ, hammond, hammond b3 |
| `trumpet` | trumpet, cornet, flugelhorn, french horn, tuba, saxhorn (conical brass — caught by `horn` before the `sax` branch, intentionally) |
| `trombone` | trombone, bass trombone |
| `sax` | tenor sax, alto sax, soprano sax, baritone sax, saxophone |
| `clarinet` | clarinet, bass clarinet, oboe, bassoon |
| `flute` | flute, piccolo |
| `bass` | bass, double bass, upright bass, contrabass, cello |
| `violin` | violin, fiddle, viola, harp |
| `guitar` | guitar, electric guitar, banjo, mandolin, ukulele |
| `drums` | drums, percussion, cymbals |
| `vibes` | vibraphone, vibes, marimba, xylophone |
| `voice` | vocals, voice, singer, scat |
| `rest` | empty string, `null`, `undefined`, `—`, any unrecognized string |

To add an instrument: append a new key to `FIG_LIB`, add a branch in
`figKey()`. No other code touches required.

---

## The corner monogram

Disambiguates musicians who share an instrument (every pianist would
otherwise look identical).

- **Type:** Geist Mono, weight 600, letter-spacing 0.04em, line-height 1
- **Color:** `color-mix(in srgb, var(--duo-hi) 75%, white)` with `opacity: 0.7`
- **Position:** `right: 7% · bottom: 6%` (absolute, inside `.duo3-mark`)
- **Content:** `initialsOf(name)` — 1–2 characters
  - Skips particles: `van`, `von`, `de`, `del`, `della`, `di`, `da`, `du`,
    `la`, `le`, `of`, `the`, `and`, `y`, `el`
  - Strips punctuation: `. , ' "`
  - "Van der Rohe" → "VR" not "VD"; "Carmen McRae" → "CM"; "Bobby Timmons"
    → "BT"

---

## Per-context sizing table

The `.duo3` tile appears at five sizes in the existing `.mu3` layout. Stroke
weight + padding + monogram size are tuned per context so the figure reads
cleanly at each.

| Context | Tile px | `.duo3-mark` padding | Stroke `.ln` | Monogram font |
| --- | --- | --- | --- | --- |
| `.mu3 .conn` (main rail spine) | 64 | 9% | 4 | **hidden** |
| `.mu3 .ident` (detail-page identity, mobile) | 64 | 10% | 4 | **hidden** |
| `.mu3 .desk-rail .ident` (desktop side rail) | 80 | 10% | 3.5 | **hidden** |
| `.mu3 .suggest-row` (autosuggest) | 44 | 11% | 4.5 | **hidden** |
| `.mu3 .mtile` (mosaic, regular) | ~80–124 | 8% | 3 | 17px |
| `.mu3 .mtile.hero` (mosaic hero tile) | ~180–250 | 12% | 2 | 32px |
| `.mu3 .era-tile` (era strip) | 140 | 12% | 2.6 | 21px |
| `.mu3 .desk-home-wrap .home-card` (home cards) | ~220+ | 14% | 2.2 | 36px |
| `.duo3.hero` (new modifier — detail-page hero, ≥ 240px) | 320×400 | 12% | 2 | 32px |
| `.duo3.tiny` (opt-in for ≤ 36px sticky-header avatars) | 32 | (inherited) | (inherited) | **hidden** |

**Why hide the monogram at dense sizes** — Below ~100px tile width, the
monogram becomes illegible and just adds visual noise. The musician's name
is always present alongside the tile in these dense layouts (conn-row name,
ident-row name, suggest-row name), so the discriminator is redundant.

---

## Design tokens

All tokens come from the existing `.mu3` palette in
`app/musicians3-styles.css` — **no new tokens introduced**. The mark
references:

- `--duo-lo` · per-musician low duotone color (existing, deterministic from
  name via `duotoneFor()`)
- `--duo-hi` · per-musician high duotone color (existing)
- `--paper` · used by some tile contexts but not by `.duo3-mark` itself
- `--line` · same

Stone+amber palette holds. The light/dark theme switch carries through
automatically because all colors are derived from `--duo-hi` / `--duo-lo`
via `color-mix(in srgb, …)`.

### Typography

- Figure stroke + monogram color: `color-mix(in srgb, var(--duo-hi) 82%, white)` (figure), `75%` (monogram)
- Monogram font: **Geist Mono**, weight 600, letter-spacing 0.04em
- (No other typography introduced — name text continues to live in the
  surrounding layout, not on the tile.)

---

## Behavior

The mark is **purely visual** — no interactions, no state, no JS beyond
React rendering. It inherits whatever click handler the parent `.duo3`
already has (e.g. `MosaicHeader`'s tap-to-pulse). `aria-hidden="true"` is
set on the mark wrapper so screen readers don't read it (the parent
component already exposes the musician's name).

### Theme switching

The mark renders identically in light + dark themes — the duotone field
is self-contained (its colors come from `--duo-lo` / `--duo-hi`, which are
*not* themed). Only the page chrome around the tile changes.

### Photo present

When a musician *does* have a free-licensed photo, the existing layout
should render `<img>` instead of `<Duo3 inst="…"/>`. The mark is the
fallback. Pattern in callsites:

```jsx
{musician.image
  ? <img src={musician.image} alt={musician.name}/>
  : <Duo3 name={musician.name} inst={musician.inst}/>}
```

---

## Adding a new instrument

1. Open `app/no-photo-figures.js`.
2. Append a new key to `FIG_LIB` with the inner SVG markup (use existing
   figures as a template — viewBox is `0 0 100 140`, `.ln` for strokes,
   `.dot` for filled circles, `.keyfill` for semi-transparent panel fills).
3. Add a branch to `figKey()` for the new instrument string(s).
4. Done. No CSS or component changes needed.

---

## Files modified

- `app/no-photo-figures.js` — **new file**
- `app/musicians3-shared.jsx` — `Duo3`, `MosaicHeader`, `ConnRow`, `EraStrip`
- `app/musicians3-styles.css` — appended `.duo3-mark` rules + per-context overrides
- Host HTML pages — `<script src="app/no-photo-figures.js"></script>` added
  before `musicians3-shared.jsx`

---

## Acceptance checklist

- [ ] Every photo-less musician renders a recognizable figure-with-instrument
- [ ] Two musicians playing the same instrument are distinguishable by monogram
- [ ] Unknown-instrument musicians render the "figure at rest" mark
- [ ] At 32–64px (dense rows / sticky header) the monogram is hidden, only
      the figure shows
- [ ] At 80–140px (era strip / mosaic) the monogram is small but readable
- [ ] At hero size (≥ 240px) the monogram is prominent
- [ ] Both dark and light themes render correctly
- [ ] No regression in tiles that *do* have a photograph (`<img>` path)
