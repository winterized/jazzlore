# Spec: Scales page

> First feature. Status: draft v0.1. Owner: Aurélien.
> This spec is meant to be refined with Claude via the Superpowers brainstorming skill *before* any code is written. The "Open questions" section is the input to that conversation.

## Goal

A page where a user picks a root note and immediately sees every relevant jazz scale built on it, with notation, audio playback, and the ability to save selected scales to a personal collection and print them.

## Why

Jazz students and players constantly look up "what scales work over X." Existing tools are either dense reference tables or paywalled. A clean, fast, mobile-friendly tool is genuinely useful, and the domain (music theory) is small and well-defined, which makes it a good learning vehicle.

## User stories

1. **Pick a root.** As a user, I select a root note (12 chromatic options, with enharmonic awareness — e.g., F♯ vs G♭).
2. **See all scales.** I see every scale rooted on that note, grouped by family (modes of major, melodic minor, harmonic minor, symmetric, pentatonic/blues, bebop).
3. **See it on score and keyboard.** Each scale shows standard notation (one octave ascending, treble clef) *and* a piano keyboard with the scale notes highlighted.
4. **Hear it.** I can click a scale to hear it played.
5. **Save it.** I can star/save a scale to "My Collection" (localStorage).
6. **View my collection.** A separate view lists my saved scales with notation and playback.
7. **Print a sheet.** I can select multiple scales from my collection and print them onto a single, well-laid-out sheet (A4 and US Letter).

## Functional requirements

### Root picker
- Chromatic picker, displayed as a horizontal row on desktop, a grid on mobile
- Default: C
- Sharp/flat toggle for enharmonics (F♯ ↔ G♭)
- URL reflects state: `/scales/C`, `/scales/F-sharp`, etc.

### Scale list
- Source of truth: Tonal's scale dictionary, filtered to a curated "jazz-relevant" list
- Grouped by family with collapsible sections
- Each scale row shows: name, intervals (e.g. 1 2 b3 4 5 6 b7), note names
- Initial collapsed state: modes of major expanded, others collapsed

### Score (notation) rendering
- abcjs, one octave ascending, treble clef
- Note size readable on mobile (min 14px equivalent)
- Renders synchronously — no flash of unrendered notation

### Piano keyboard rendering
- Custom SVG component (no library) — small surface, easy to TDD, full styling control
- Range: 2 octaves, starting at the C at or below the scale root (so the full scale + context fits)
- Scale notes highlighted; root key distinguished from the other scale tones (different color or accent)
- Optional toggle: show note names on highlighted keys
- Renders synchronously, mobile-friendly (touch targets sized for future tap-to-play)

### Audio playback
- Tone.js with a clean piano sample (e.g. Salamander)
- Tempo: 120 BPM, quarter notes, one octave ascending
- One scale plays at a time; clicking another stops the first
- Audio engine initialized lazily on first user gesture (browser autoplay rules)

### Save / collection
- "Star" button on each scale row
- Saved scales: `{ rootNote, scaleName, savedAt }`
- Stored in `localStorage` under key `jazz-reference:scales:v1`
- Versioned key so we can migrate cleanly later
- "My Collection" route at `/collection/scales`

### Print
- Selection UI in collection view: checkboxes + "Print selected"
- Print stylesheet: scales laid out 2 per row on A4 / Letter, scale name + notation, no UI chrome
- User selects page size in their browser print dialog

## UI sketch (text)

```
┌──────────────────────────────────────────────┐
│ Jazz Reference                    [ ☰ menu ] │
├──────────────────────────────────────────────┤
│ Root: [ C  C♯ D  D♯ E  F  F♯ G  G♯ A  A♯ B ] │
│       (♯ / ♭ toggle)                          │
├──────────────────────────────────────────────┤
│ ▾ Modes of major (7)                          │
│   ★ Ionian       1 2 3 4 5 6 7    [♪]         │
│     ┌──── score (abcjs) ─────────────────┐    │
│     └────────────────────────────────────┘    │
│     ┌──── piano (highlighted notes) ─────┐    │
│     └────────────────────────────────────┘    │
│   ★ Dorian       1 2 ♭3 4 5 6 ♭7  [♪]         │
│   ...                                         │
│ ▸ Modes of melodic minor (7)                  │
│ ▸ Modes of harmonic minor (7)                 │
│ ▸ Symmetric (3)                               │
│ ▸ Pentatonic & blues (4)                      │
│ ▸ Bebop (4)                                   │
└──────────────────────────────────────────────┘
```

## Non-functional requirements

- Lighthouse performance > 90, accessibility > 95
- Total JS payload < 300 KB gzipped excluding audio samples
- Keyboard navigable: tab through root picker, then through scales
- Works offline after first load (stretch goal, not blocking v1)

## Out of scope (v1)

- Multi-octave display
- Bass clef
- Different tempos / playback styles
- Sharing collections via URL
- Auth / cloud sync (will come with Supabase)
- Chord overlay on scales (lives in the chords spec)

## Open questions

These need to be resolved with Claude during the Superpowers brainstorming pass, *before* coding.

1. **Curated scale list.** Which exact scales make the "jazz-relevant" cut? Tonal exposes ~90; we probably want ~30. Need a final, named list in this spec.
2. **Enharmonics.** When the user picks F♯, do we display F♯ Ionian or auto-flip to G♭ Ionian based on convention? (Major scales with many sharps/flats have idiomatic spellings.)
3. **Audio engine.** Tone.js Sampler with Salamander piano is the obvious choice — confirm it loads fast enough on mobile, otherwise fall back to a simpler synth.
4. **Print layout details.** Is 2 scales per row right, or 1 (bigger notation) or 3 (more density)? Configurable, but pick a default.
5. **Mobile root picker.** Horizontal scroll vs grid vs wheel — prototype quickly and decide.
6. **Piano keyboard details.** 2 octaves the right default, or 1? Should the root be a different color from other scale tones, or use a small dot/marker? Should the keyboard be tap-to-play from v1, or static for v1 and interactive later?

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

1. Project skeleton (Vite, TS, Tailwind, Vitest, Playwright, ESLint, Prettier)
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
