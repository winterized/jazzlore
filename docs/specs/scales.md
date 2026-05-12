# Spec: Scales page

> First feature. Status: v1.0 (brainstorming complete, 2026-05-12). Owner: Aurélien.

## Goal

A page where a user picks a root note and immediately sees every relevant jazz scale built on it, with notation, audio playback, and the ability to save selected scales to a personal collection and print them.

## Why

Jazz students and players constantly look up "what scales work over X." Existing tools are either dense reference tables or paywalled. A clean, fast, mobile-friendly tool is genuinely useful, and the domain (music theory) is small and well-defined, which makes it a good learning vehicle.

## User stories

1. **Pick a root.** As a user, I select a root note (12 chromatic options, with enharmonic awareness — e.g., F♯ vs G♭).
2. **See all scales.** I see every scale rooted on that note, grouped by family (modes of major, melodic minor, harmonic minor, symmetric, pentatonic/blues, bebop, exotic).
3. **See it on score and keyboard.** Each scale shows standard notation (one octave ascending, treble clef) *and* a piano keyboard with the scale notes highlighted.
4. **Hear it.** I can click a scale to hear it played.
5. **Save it.** I can star/save a scale to "My Collection" (localStorage).
6. **View my collection.** A separate view lists my saved scales with notation and playback.
7. **Print a sheet.** I can select multiple scales from my collection and print them onto a single, well-laid-out sheet (A4 and US Letter).

## Functional requirements

### Root picker

- Chromatic picker, 12 buttons, each pre-spelled with its jazz-default enharmonic
- Default selection: C
- **Layout — single component, two CSS layouts:**
  - Mobile (< 768 px): **4 columns × 3 rows** grid, chromatic order across (C, D♭, D, E♭ / E, F, F♯, G / A♭, A, B♭, B)
  - Tablet / desktop (≥ 768 px): horizontal row of 12 buttons
  - Implementation: one React component, `grid-template-columns` swapped at the `md:` breakpoint. Identical button behavior across both layouts.
- **Selected root** is visually highlighted (accent background + focus ring) and exposed via `aria-pressed` for screen readers

**Default spellings** (flat-side wins for all ambiguous pitches except F♯, which is a true wash and follows sharp-side tradition):

| Position | Default label | Toggle alternate |
|---|---|---|
| 1 | C | — |
| 2 | D♭ | C♯ |
| 3 | D | — |
| 4 | E♭ | D♯ |
| 5 | E | — |
| 6 | F | — |
| 7 | F♯ | G♭ |
| 8 | G | — |
| 9 | A♭ | G♯ |
| 10 | A | — |
| 11 | B♭ | A♯ |
| 12 | B | — |

**Enharmonic toggle (per-button, not global).** On the five ambiguous buttons (D♭, E♭, F♯, A♭, B♭), a small corner sub-button shows the alternate spelling (♯ or ♭). Tapping the body of the button **selects** that root; tapping the corner sub-button **flips** the spelling in place (D♭ ↔ C♯, etc.) without moving cells. The seven natural buttons (C, D, E, F, G, A, B) have no toggle — visual cue that they are unambiguous. Toggling re-spells **only that button**; the other 11 stay on their defaults. The URL reflects the current spelling.

The corner sub-button is visually small (~14 px) but has invisible padding extending the hit area to ≥ 24 px square per WCAG 2.5.5. Separate `aria-label` from the main button (e.g. `"Switch D-flat to C-sharp"`).

**No auto-flip policy.** The scale list always uses the exact root spelling the user selected, across every scale and mode. If the user picks D♭, every row shows `D♭ Ionian`, `D♭ Dorian`, …, `D♭ Locrian` — even when the resulting spelling is gnarly (e.g. `D♭ Aeolian` produces `D♭ E♭ F♭ G♭ A♭ B𝄫 C♭`). The user can toggle to C♯ to get the clean spelling. Predictability and consistency are the priority; Tonal handles the underlying note math.

**URL format:**

- Natural notes: `/scales/C`, `/scales/D`, `/scales/E`, `/scales/F`, `/scales/G`, `/scales/A`, `/scales/B`
- Flats (defaults for ambiguous pitches): `/scales/D-flat`, `/scales/E-flat`, `/scales/A-flat`, `/scales/B-flat`
- Sharps (defaults + alternates): `/scales/F-sharp` (default), `/scales/C-sharp`, `/scales/D-sharp`, `/scales/G-sharp`, `/scales/A-sharp`, `/scales/G-flat`

### Scale list

- Source of truth: Tonal's scale dictionary, supplemented with manually-defined scales where Tonal doesn't expose them under the intended name
- Grouped by family with collapsible sections
- Each scale row shows: **primary name**, optional **alias** (smaller subtitle, only set where a different common name is widely used), **intervals** (e.g. `1 2 ♭3 4 5 6 ♭7`), and **note names** for the currently selected root
- Initial collapsed state: **Modes of major** expanded, all other families collapsed

#### Curated set (v1) — 38 scales, 7 families

**Modes of major (7)**

| Name | Alias | Intervals |
|---|---|---|
| Ionian | Major | 1 2 3 4 5 6 7 |
| Dorian | | 1 2 ♭3 4 5 6 ♭7 |
| Phrygian | | 1 ♭2 ♭3 4 5 ♭6 ♭7 |
| Lydian | | 1 2 3 ♯4 5 6 7 |
| Mixolydian | | 1 2 3 4 5 6 ♭7 |
| Aeolian | Natural minor | 1 2 ♭3 4 5 ♭6 ♭7 |
| Locrian | | 1 ♭2 ♭3 4 ♭5 ♭6 ♭7 |

**Modes of melodic minor (7)**

| Name | Alias | Intervals |
|---|---|---|
| Melodic minor | Minor-major | 1 2 ♭3 4 5 6 7 |
| Dorian ♭2 | Phrygian ♮6 | 1 ♭2 ♭3 4 5 6 ♭7 |
| Lydian augmented | | 1 2 3 ♯4 ♯5 6 7 |
| Lydian dominant | Lydian ♭7 | 1 2 3 ♯4 5 6 ♭7 |
| Mixolydian ♭6 | Aeolian dominant | 1 2 3 4 5 ♭6 ♭7 |
| Locrian ♮2 | Half-diminished | 1 2 ♭3 4 ♭5 ♭6 ♭7 |
| Altered | Super Locrian | 1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭7 |

**Modes of harmonic minor (7)**

| Name | Alias | Intervals |
|---|---|---|
| Harmonic minor | | 1 2 ♭3 4 5 ♭6 7 |
| Locrian ♮6 | | 1 ♭2 ♭3 4 ♭5 6 ♭7 |
| Ionian ♯5 | | 1 2 3 4 ♯5 6 7 |
| Dorian ♯4 | Ukrainian Dorian | 1 2 ♭3 ♯4 5 6 ♭7 |
| Phrygian dominant | Spanish Phrygian | 1 ♭2 3 4 5 ♭6 ♭7 |
| Lydian ♯2 | | 1 ♯2 3 ♯4 5 6 7 |
| Super Locrian ♭♭7 | Altered diminished | 1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭♭7 |

**Symmetric (3)**

| Name | Alias | Intervals |
|---|---|---|
| Whole tone | | 1 2 3 ♯4 ♯5 ♭7 |
| Diminished (half-whole) | Dominant diminished | 1 ♭2 ♭3 3 ♯4 5 6 ♭7 |
| Diminished (whole-half) | Auxiliary diminished | 1 2 ♭3 4 ♭5 ♭6 6 7 |

**Pentatonic & blues (4)**

| Name | Alias | Intervals |
|---|---|---|
| Major pentatonic | | 1 2 3 5 6 |
| Minor pentatonic | | 1 ♭3 4 5 ♭7 |
| Blues | Minor blues | 1 ♭3 4 ♭5 5 ♭7 |
| Major blues | | 1 2 ♭3 3 5 6 |

**Bebop (4)**

| Name | Alias | Intervals |
|---|---|---|
| Bebop dominant | | 1 2 3 4 5 6 ♭7 7 |
| Bebop major | | 1 2 3 4 5 ♯5 6 7 |
| Bebop dorian | | 1 2 ♭3 3 4 5 6 ♭7 |
| Bebop melodic minor | | 1 2 ♭3 4 5 ♭6 6 7 |

**Exotic (6)** — collapsed by default

| Name | Alias | Intervals |
|---|---|---|
| Double harmonic | Byzantine, Arabic | 1 ♭2 3 4 5 ♭6 7 |
| Hungarian minor | | 1 2 ♭3 ♯4 5 ♭6 7 |
| Romanian minor | | 1 2 ♭3 ♯4 5 6 ♭7 |
| Persian | | 1 ♭2 3 4 ♭5 ♭6 7 |
| Hirajoshi | Japanese pentatonic | 1 2 ♭3 5 ♭6 |
| In Sen | Japanese | 1 ♭2 4 5 ♭7 |

> Implementation note: when writing `lib/music.ts`, map each row to either a Tonal scale name (`ScaleType.get(...)`) or, when Tonal doesn't expose the intended scale under a usable name, define it from explicit intervals. Cross-checking against `ScaleType.all()` is a TDD task at implementation time, not a spec decision.

### Score (notation) rendering
- abcjs, one octave ascending, treble clef
- Note size readable on mobile (min 14px equivalent)
- Renders synchronously — no flash of unrendered notation

### Piano keyboard rendering

**Implementation:** custom SVG component (no library) — small surface, easy to TDD, full styling control. Hand-built with `<rect>` elements.

**Range: always 2 octaves, C-to-C.** Start at the C at or below the scale root, span exactly two octaves up. The scale notes light up across this range; for non-C roots the root sits inside the keyboard rather than at the edge. Keeping the keyboard outline fixed (always starts at a C, always 24 keys total: 14 white + 10 black) makes the visual consistent across all 12 roots.

**Visual treatment of the keys (v1 baseline — subject to visual validation at implementation):**

| Key role | Light theme | Dark theme |
|---|---|---|
| **Root** | solid accent (e.g. `amber-500`) | solid accent (e.g. `amber-400`) |
| **Other scale notes** | light accent (e.g. `amber-200` on white keys; darker amber on black keys) | muted accent |
| **Non-scale notes** | neutral (white keys `stone-50`, black keys `stone-800`) | neutral (inverted) |

A color hierarchy was chosen over the small-marker alternative because color reads at a glance on mobile and there is no slim-black-key marker positioning to manage. **This may be revisited once the component is rendered** — if the chosen accent doesn't actually distinguish the root clearly enough, fall back to a marker (or add one on top of the color).

**Optional toggle:** "Show note names" — when on, displays the note name on each highlighted (scale) key. Off by default to keep the visual clean.

**Interactivity:**

- **v1: static.** No tap-to-play. The "Play scale" button on each scale row (audio engine, Q2 above) covers the main use case. White-key width of ~24 px on mobile is below the 48 px WCAG tap target, which is fine for v1 since the keys aren't interactive.
- **v2 (deferred):** tap-to-play on individual keys. Will need a mobile layout adjustment (e.g. 1-octave-on-mobile or pinch-zoom) to satisfy tap target sizes. Not a v1 problem.

**Synchronous rendering.** No flash of unrendered keyboard. The component takes a small, pure prop shape:

```tsx
type Props = {
  scaleNotes: string[]   // e.g. ['B♭', 'C', 'D♭', 'E♭', 'F', 'G', 'A♭']
  root: string           // e.g. 'B♭'
  startOctave: number    // computed by caller: octave of the "C at or below root"
  showNoteNames?: boolean
}
```

Per CLAUDE.md, domain logic stays in `lib/music.ts` — the component takes pre-computed scale notes and renders. Snapshot tests on the SVG output cover the rendering contract.

### Audio playback

**Engine:** Tone.js `Sampler` with Salamander Grand Piano samples (self-hosted in `/public/audio/piano/`, CC-licensed). Tone.js synth (`PolySynth` with triangle wave + envelope) as a load-failure fallback only.

**Sample set:** ~10 Salamander pitches across the piano range (C2/A2/C3/A3/C4/A4/C5/A5/C6/A6 or equivalent even spread). Served as **OGG with MP3 fallback** (Safari iOS needs MP3). Total payload **~1.2–1.8 MB**, outside the JS budget per the non-functional requirements.

**Playback parameters:** 120 BPM, quarter notes, one octave ascending. One scale plays at a time — clicking another stops the first.

**Lifecycle:**

1. App load: no audio activity. The audio context is not started.
2. First user click on a play button: `Tone.start()` runs inside the click handler (required for iOS Safari autoplay rules), then sample loading begins.
3. While samples load: show an inline indicator on the requested scale row ("loading piano sound…"). Expected: <1s on broadband, 2–4s on 4G.
4. Samples loaded: play the requested scale; subsequent plays are instant. Browser caches the samples for revisits.

**Fallback** (failure mode only, never the default): if sample loading errors out or exceeds **5 seconds**, drop to the synth fallback for the rest of the session and surface a small notice — "piano samples unavailable, using fallback sound".

**Licensing:** Salamander attribution lives next to the audio assets in `public/audio/piano/LICENSE.md` when assets are added.

### Save / collection
- "Star" button on each scale row
- Saved scales: `{ rootNote, scaleName, savedAt }`
- Stored in `localStorage` under key `jazz-reference:scales:v1`
- Versioned key so we can migrate cleanly later
- "My Collection" route at `/collection/scales`

### Print

**Selection UI** in the collection view: checkboxes on each saved scale + a "Print selected" button.

**Density selector** beside the print button:

```
Layout: ( ) 1 per row    (•) 2 per row    ( ) 3 per row
        bigger notation   default          dense reference
```

Choice persists in `localStorage` (same store as saved scales, scoped key).

| Mode | Per row | Per A4 | Per-scale content |
|---|---|---|---|
| Comfortable | 1 | ~5 | name + alias + intervals + score + note names |
| **Default** | **2** | **~10** | name + intervals + score + note names |
| Dense | 3 | ~15 | name + score only |

**Per-scale block** (default mode):

- Scale name (larger, bold) — with optional alias as smaller subtitle
- Intervals in 40% grey (e.g. `1 2 ♭3 4 5 6 ♭7`)
- abcjs score: one octave ascending, treble clef
- Note names for the current root, below the score

**Page header** on every page: "Jazzlore — My scales" + date (top-left), page number (bottom-right). Small, light grey.

**Print stylesheet rules:**

- `@media print` strips every UI chrome (nav, buttons, toggles, logos)
- `break-inside: avoid` on each scale block (no scale split across pages)
- Backgrounds forced to white (toner-friendly)
- Fluid CSS grid based on viewport width — A4 and US Letter both handled by the same stylesheet, user picks page size in browser print dialog
- abcjs renders SVG, so the music scales cleanly at print DPI; column width drives the music scale factor

**Keyboard is intentionally not included on print.** Printed sheets are for reading and playing — the keyboard is a screen learning aid.

## UI sketch (text)

```
┌──────────────────────────────────────────────────┐
│ Jazzlore — Scales                  [ ☰ menu ]    │
├──────────────────────────────────────────────────┤
│ Root: [ C  D♭ D  E♭ E  F  F♯ G  A♭ A  B♭ B ]     │
│         ↑♯    ↑♯       ↑♭    ↑♯    ↑♯            │
│       (small corner sub-buttons on the 5         │
│        ambiguous notes flip the spelling)        │
├──────────────────────────────────────────────────┤
│ ▾ Modes of major (7)                              │
│   ★ Ionian       1 2 3 4 5 6 7    [♪]             │
│     ┌──── score (abcjs) ─────────────────┐        │
│     └────────────────────────────────────┘        │
│     ┌──── piano (highlighted notes) ─────┐        │
│     └────────────────────────────────────┘        │
│   ★ Dorian       1 2 ♭3 4 5 6 ♭7  [♪]             │
│   ...                                             │
│   ★ Aeolian                                       │
│     Natural minor   1 2 ♭3 4 5 ♭6 ♭7  [♪]         │
│   ...                                             │
│ ▸ Modes of melodic minor (7)                      │
│ ▸ Modes of harmonic minor (7)                     │
│ ▸ Symmetric (3)                                   │
│ ▸ Pentatonic & blues (4)                          │
│ ▸ Bebop (4)                                       │
│ ▸ Exotic (6)                                      │
└──────────────────────────────────────────────────┘
```

## Non-functional requirements

- Lighthouse performance > 90, accessibility > 95
- Total JS payload < 300 KB gzipped excluding audio samples
- Keyboard navigable: tab through root picker, then through scales
- Works offline after first load (stretch goal, not blocking v1)

## Out of scope (v1)

- Multi-octave score notation (the score is always one octave ascending; the piano keyboard is two octaves)
- Bass clef
- Different tempos / playback styles
- Sharing collections via URL
- Auth / cloud sync (will come with Supabase)
- Chord overlay on scales (lives in the chords spec)

## Open questions

All v1 open questions resolved during brainstorming on 2026-05-12. See git history for the resolution trace; the body of this spec reflects the decisions.

One item remains *provisional pending visual validation at implementation time*: **the root-key visual treatment** (color hierarchy vs marker). The current spec commits to color hierarchy as v1 baseline; if the rendered component doesn't make the root pop clearly enough, fall back to a marker (or layer one on top of the color).

## Acceptance criteria (v1 ships when…)

- [ ] All 12 roots selectable
- [ ] Curated scale list (final list documented in this spec)
- [ ] Notation renders for every scale on every root, no errors
- [ ] Piano keyboard renders for every scale on every root, with the root visually distinguished
- [ ] Audio playback works on Chrome desktop, Safari iOS, Chrome Android
- [ ] Save / unsave persists across page reloads
- [ ] Print preview produces a clean sheet on A4
- [ ] All unit tests green; one Playwright e2e covering "pick C → save Dorian → see it in collection → print preview"
- [ ] Lighthouse thresholds met
- [ ] No `any`, no `console.log`, no unaddressed TODOs

## Implementation order (suggested)

1. ✅ Project skeleton (Vite, TS, Tailwind, Vitest, Playwright, ESLint, Prettier) — done 2026-05-12
2. `lib/music.ts` — wraps Tonal, returns curated scale list for a root (TDD this)
3. `lib/storage.ts` — versioned localStorage wrapper (TDD this)
4. Root picker component
5. Scale list + score notation (no audio yet)
6. Piano keyboard component (TDD this — small SVG, deterministic output)
7. Audio playback
8. Save / collection view
9. Print stylesheet
10. Accessibility pass, Lighthouse pass
11. Deploy
