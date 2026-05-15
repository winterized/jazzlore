# Jazzlore — chords app memory

The second sub-site of the Jazzlore portfolio: a public, polished jazz chords reference. Planned at <https://chords.jazzlore.com>. See `/CLAUDE.md` at the repo root for workspace-wide context and conventions.

## App-specific tech

- **Build:** Vite (config at `apps/chords/vite.config.ts`). Dev server pinned to port 5174 so Playwright's multi-app `webServer` array can target both apps deterministically.
- **Routing:** React Router. Routes: `/chords/:root` (e.g. `/chords/D-flat`), `/collection/chords`. **No bare `/collection` route** — symmetric with scales. SPA fallback handled by Cloudflare's `not_found_handling: "single-page-application"`.
- **Music theory:** `@jazzlore/music-core` — the chord helpers (`chordNotes`, `formatPrimarySymbol`, `formatAlternateSymbol`) live in `packages/music-core/src/chord.ts`. Domain logic stays out of components.
- **Score rendering:** `abcjs` via `<AbcScore>` from `@jazzlore/ui` (the wrapper is promoted from scales' `ScaleScore` so chord and scale screens share it). ABC strings are built per-app with `buildChordAbc` / `buildAbcTune` from `@jazzlore/music-core/abc`.
- **Piano keyboard:** `<PianoKeyboard>` from `@jazzlore/ui` — purely presentational SVG, takes pre-computed pitch classes plus a `startPc` to anchor the 2-octave visible window at the chord's root.
- **Audio:** `playChord(notes, 'arp-then-block')` from `@jazzlore/music-core/audio` (Tone.js, lazy-loaded). Plays each note in sequence ~150 ms apart then a brief block at the end, ~2 s total. Reuses the same Salamander piano samples scales loads from `apps/scales/public/audio/piano/`.
- **Persistence:** `localStorage` via `@jazzlore/music-core/storage` with namespace key `jazzlore:chords:v1`. Saved shape: `{ rootNote, chordId, savedAt }`. Never call `localStorage` directly — the storage module is the seam if we ever swap for a backend.
- **Deployment:** second Cloudflare Workers Static Assets project (`jazzlore-chords`) configured via `wrangler.chords.jsonc` at the repo root. Independent of scales' deployment.

## Source structure (`apps/chords/src/`)

```
data/             curated.ts — the 27-chord canonical list
features/         Feature-scoped folders (chords/, collection/, audio/)
lib/              App-specific helpers (e.g. useTheme wrapper)
pages/            Route components (ChordsPage, ChordCollectionPage)
styles/           App globals (print.css)
test/setup.ts     vitest setup (jest-dom + localStorage polyfill for Node 26 + jsdom 29 + Vitest 4)
```

## Chord display conventions (locked 2026-05-14)

Each chord row shows the chord symbol in **two notational forms simultaneously**:

- **Primary** at full type size on top — modern lead-sheet style (`Cmaj7`, `Cm`, `Cm7♭5`, `Cdim7`, `Caug`). Spelled-out qualities; Unicode `♭` / `♯` for accidentals.
- **Alternate** in smaller subdued type underneath — traditional jazz style (`CΔ7`, `C-`, `Cø7`, `C°7`, `C+`). No parentheses; the size difference does the work.
- When no alternate is materially different from the primary (`C`, `C7`, `Csus2`, `Csus4`), the alternate slot stays empty so vertical rhythm down the page is preserved.

The canonical mapping table lives in `apps/chords/src/data/curated.ts`. Display always uses Unicode accidentals; internal data IDs are ASCII-safe (`m7b5`, `7s9`, `7b13`, `7alt`).

## Chord ordering

By chord size (triads → 6ths → 7ths → 9ths → 11ths → 13ths), sub-ordered within each bucket by quality (major → minor → dominant clean → dominant altered). `C7alt` ends the list naturally as the densest 13th-class chord. See `apps/chords/docs/chords.md` for the full 27-chord ordered list.

As of the 2026-05-15 sticky-header design, chords are rendered **grouped by category** (TRIADS / SIXTHS / SEVENTHS / NINTHS / EXTENDED / ALTERED) with faint body section-divider headers — the within-group order is unchanged (size + quality), only flat→grouped presentation changed. The page also has a shared sticky header (`StickyHeader` from `@jazzlore/ui`). See `apps/chords/docs/chords.md` → "Superseded by the sticky-header design".

## Definition of done (per feature)

- [ ] Spec in `apps/chords/docs/chords.md` (or `docs/specs/<feature>.md` for sub-features) up to date.
- [ ] Unit tests for domain logic, green; component tests where behavior matters.
- [ ] Renders correctly on mobile and desktop, light and dark themes.
- [ ] Keyboard accessible.
- [ ] No `console.log`, no `any`, no TODO without a linked issue.
- [ ] Lighthouse: perf > 90, a11y > 95.
- [ ] Zero divergence from `@jazzlore/ui` and `@jazzlore/music-core` — no app-local copies of shared components.

## Learning goals (Aurélien)

This project is also a learning instrument. When there's tension between "ship fastest" and "learn modern practice", lean toward learn — and explain the tradeoff. Specifically hands-on experience with: spec-driven development with AI, TDD with AI, the Superpowers plugin workflow, Context7 for fresh library docs, Playwright MCP for self-validating UI changes, modern frontend defaults (Vite, TS strict, Tailwind, accessibility). Treat me as a senior engineer returning from a long break, not a beginner.

## Out of scope (this app, v1)

- Chord inversions (1st, 2nd, 3rd inversion display) — could be v1.1.
- Chord voicings beyond root position (drop 2, drop 3, shell voicings) — could be v1.1.
- Custom chord builder.
- MIDI input / output.
- Sharing collections via URL.
- Auth / cloud sync.
- A combined `/collection` view spanning scales and chords — structurally blocked by cross-subdomain `localStorage` isolation. Deferred until a possible future single-subdomain hub.
