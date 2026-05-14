# Spec: Chords page

> Second site. Status: draft v0.1. Owner: Aurélien.
> Mirrors the structure of `apps/scales/docs/specs/scales.md`. Where a decision is "same as scales," it is called out explicitly — these come from `packages/ui` and `packages/music-core` and must not diverge without a spec update on both sides.
> Lives at `chords.jazzlore.com`.

## Goal

A page where a user picks a root note and instantly sees every relevant jazz chord built on it, with notation, audio playback, piano keyboard visualization, and the ability to save selected chords to a personal collection and print them.

## Why

Chords are the second pillar of jazz reference (alongside scales). The site completes the "what can I play here" loop — scales tell you the notes available; chords tell you the harmonic frame they imply. Together they form a coherent reference tool.

## Reused from the scales project (via `packages/ui` and `packages/music-core`)

These are *not* re-decided here. They come from the shared packages:

- Root picker with the same 12 default roots and enharmonic toggle behavior
- Piano keyboard component (2 octaves, root highlighted, notes accented)
- Audio engine (Tone.js Sampler with Salamander piano, lazy init on first user gesture, synth fallback)
- Storage abstraction (`packages/music-core/storage`) with namespaced localStorage
- Theme system (light/dark toggle, persists, respects `prefers-color-scheme`)
- Typography scale, color tokens, spacing tokens, button primitives
- All accessibility patterns (keyboard nav, ARIA, contrast)

If any of the above needs to change for chords, the change happens in the shared package, and `scales.jazzlore.com` must redeploy identically. No app-local forks.

## User stories

1. **Pick a root.** Same root picker as scales, same 12 defaults, same enharmonic toggle. URL reflects state: `/chords/C`, `/chords/F-sharp`, etc.
2. **See all chords on a single page.** Unlike scales (grouped families, collapsible), chords are displayed as one continuous, scrollable, ungrouped grid list. The order is the source of truth (see "Chord ordering" below).
3. **See it on score and keyboard.** Each chord shows standard notation (in root position, treble clef) and the piano keyboard with chord notes highlighted.
4. **Hear it.** I can click a chord to hear it played — see "Audio playback" for the open question on arpeggiated vs. block.
5. **Save it.** I can star a chord to "My Chord Collection" (localStorage).
6. **View my chord collection.** A separate view at `/collection/chords` lists my saved chords with notation and playback.
7. **Print a sheet.** I can select multiple chords from my collection and print them onto a single, well-laid-out sheet (A4 and US Letter). Print density selector reused from scales.

## Functional requirements

### Root picker
Same as scales. Composed from `<RootPicker />` in `packages/ui`. URL pattern `/chords/<slug>` (e.g. `/chords/C`, `/chords/F-sharp`). Invalid roots redirect to `/chords/C`.

### Chord list (ungrouped, all on one page)
This is the main structural difference from scales.

- One flat, scrollable grid list, no family grouping, no collapsible sections
- Order matters and is fixed — see "Chord ordering" below
- Each chord element shows: chord symbol (e.g. `Cmaj7`), full name (e.g. "C major seventh"), interval formula (e.g. `1 3 5 7`), note names (e.g. `C E G B`), score, piano keyboard, play button, star button
- Sticky scroll header? — see open question

### Curated chord list
Needs to be finalized in the brainstorming session. Initial proposed coverage:

- **Triads:** major, minor, diminished, augmented, sus2, sus4
- **Sixth chords:** maj6, min6, 6/9
- **Seventh chords:** maj7, min7, dominant 7, min7♭5, dim7, minMaj7
- **Tensions / altered dominants:** 7♭9, 7♯9, 7♯11, 7♭13, 7alt, 13, maj7♯11
- **Extended:** maj9, min9, 9, min11, 13

Approximate target: 25–30 chords. Final list lives in `apps/chords/src/data/curated.ts`.

### Chord ordering
A single ordering must be decided. Options:

1. By chord size (triads → 6ths → 7ths → 9ths → 11ths → 13ths)
2. By family (major-quality → minor-quality → dominant-quality → diminished/altered)
3. By "pedagogical jazz order" (most-common → least-common: maj7, min7, 7, min7♭5, dim7, then extensions)

Recommendation: **option 1 (by chord size)** for v1 — most predictable, easiest to navigate when looking up a specific chord. To be confirmed in brainstorming.

### Score (notation) rendering
- Reuses the abcjs wrapper from `packages/ui` (or `apps/scales/src/features/scales/ScaleScore.tsx` — to be promoted to shared)
- Display in root position, treble clef, one octave
- For chords spanning more than one octave (some 11s and 13s), see open question

### Piano keyboard rendering
Same component as scales (`<PianoKeyboard />` in `packages/ui`). The component takes a list of note semitones from the root and a "role" marker for the root key. For chords:
- All chord tones highlighted
- Root key visually distinguished (same treatment as scales)
- Range: 2 octaves ?

For chords spanning more than one octave on the keyboard (some extended chords), to be discussed in brainstorming

### Audio playback
Same engine as scales. The open question is *how* a chord is played by default:
- **Block:** all notes simultaneously, sustained briefly (~1 second)
- **Arpeggiated:** notes played in sequence, root upward, then a brief block at the end
- **Both, user-selectable per chord:** small toggle on the row

To be discussed.

### Save / collection
Same shape as scales but separate storage key: `jazzlore:chords:v1` (note the version number — independent of scales' version).
- Saved chord shape: `{ rootNote, chordId, savedAt }`
- "My Chord Collection" route at `/collection/chords`
- Optional combined view at `/collection` showing both scales and chords — see open question

### Print
Same print stylesheet as scales. Same kind of density selector. Difference: each printed chord shows its symbol prominently (chord symbols are the primary reference shorthand for jazz musicians — `Cmaj7` is more useful on a printed sheet than the full name). Optional: chord diagrams in addition to/instead of notation — see open question.

## UI sketch (text)

```
┌──────────────────────────────────────────────┐
│ Jazzlore · Chords                  [ ☰ menu ] │
├──────────────────────────────────────────────┤
│ Root: [ C  C♯ D  D♯ E  F  F♯ G  G♯ A  A♯ B ] │
│       (♯ / ♭ toggle)                          │
├──────────────────────────────────────────────┤
│ C       C major          1 3 5      [♪][★]  │
│         ┌── score ─────┐ ┌── keyboard ────┐  │
│         └──────────────┘ └────────────────┘  │
├──────────────────────────────────────────────┤
│ Cm      C minor          1 ♭3 5     [♪][★]  │
│         ...                                   │
├──────────────────────────────────────────────┤
│ Cmaj7   C major 7th      1 3 5 7    [♪][★]  │
│         ...                                   │
├──────────────────────────────────────────────┤
│ ... continues scrolling, ~25-30 chords ...    │
└──────────────────────────────────────────────┘
```

No family headers. No collapse. One flat scrollable grid list.

## Non-functional requirements

Same as scales:
- Lighthouse mobile performance > 90, accessibility 100, best practices 100, SEO 100
- Total JS payload < 300 KB gzipped excluding audio samples (shared between apps means this should be easier, not harder)
- Keyboard navigable end to end
- Works on Chrome desktop, Safari iOS, Chrome Android

## Out of scope (v1)

- Chord inversions (1st, 2nd, 3rd inversion display) -> could be v1.1
- Chord voicings beyond root position (drop 2, drop 3, shell voicings) -> could be v1.1
- Custom chord builder
- MIDI input / output
- Sharing collections via URL
- Auth / cloud sync
- The combined `/collection` view (see open question)

## Open questions

Resolve in brainstorming, before any code is written.

1. **Chord ordering.** Option 1 (by size) is my recommendation. Confirm or pick another.
2. **Default playback mode.** Block, arpeggiated, or both with a global default? Which default if "both"?
3. **Grand staff for extended chords.** Treble-only and let the chord pile high, or use grand staff for chords spanning > 1 octave? Consistency vs. readability.
4. **Sticky chord-symbol header.** When scrolling the long flat list, should the chord symbol (e.g. `Cmaj7`) of the row in view stick to the top? Helps orientation in a 30-row list.
5. **Combined collection view.** Should there be a `/collection` route that shows both scales and chords side by side? Or keep them strictly separate at `/collection/scales` and `/collection/chords`? Affects the storage shape and the navigation.
6. **Chord symbol display.** Lots of conventions exist for chord symbols (`Cmaj7` vs `CΔ7` vs `CM7`). Pick one canonical form. Recommendation: `Cmaj7` style (most common in modern jazz lead sheets).
7. **Curated chord list.** Confirm the proposed ~25–30 chords or revise. Some candidates for exclusion: maj7♯11 (covered by Lydian context), 13 (often implies 7♭9♯11♭13 — pick one)...
8. **Where does the print show the chord symbol?** Above the score (more visible) or beside it (saves vertical space). 
9. **How do we render chords spanning over 2 octaves** If we agreed to use the same keyboard element we used for scales, should we display it the same way (always the same position), or must we adapt it to the chord? 

## Acceptance criteria (v1 ships when…)

- [ ] All 12 roots selectable, enharmonic toggle working
- [ ] Final curated chord list (~25–30, decided in brainstorming) renders
- [ ] Single ungrouped scrollable list, ordering decided and applied
- [ ] Each chord element shows: symbol, name, intervals, notes, score, keyboard, play, star
- [ ] Notation renders for every chord on every root, no errors
- [ ] Piano keyboard renders with root visually distinguished
- [ ] Audio playback works (mode per open question 2)
- [ ] Save / unsave persists across reloads
- [ ] `/collection/chords` lists saved chords
- [ ] Print preview produces a clean A4 / Letter sheet with chord symbols prominent
- [ ] Light + dark theme work, theme toggle persists
- [ ] All unit tests green; one Playwright e2e covering "pick C → save Cmaj7 → see in collection → print preview"
- [ ] Lighthouse thresholds met (mobile perf > 90, a11y/best/SEO 100)
- [ ] No `any`, no `console.log`, no unaddressed TODOs
- [ ] Zero divergence from `packages/ui` and `packages/music-core` — no app-local copies of shared components

## Implementation order (suggested)

1. `apps/chords/` skeleton (Vite + TS + Tailwind, importing from packages)
2. `apps/chords/src/data/curated.ts` — TDD the chord data
3. `packages/music-core/chord.ts` — pure function `chordNotes(root, chordId): Note[]` (TDD)
4. Router + page shell, reusing routing helpers from scales where applicable
5. Compose the chord list page from existing `<RootPicker />`, `<PianoKeyboard />`, score wrapper
6. `<ChordRow />` — new composition, mostly layout, minimal logic
7. Audio integration (call existing engine with new "play chord" mode)
8. Save / collection (reuse storage abstraction, new namespace)
9. `/collection/chords` page
10. Print stylesheet adaptations (chord symbol prominence)
11. Theme audit — verify dark mode works in the new app
12. Lighthouse pass
13. End-to-end happy path
14. Deploy `chords.jazzlore.com`
