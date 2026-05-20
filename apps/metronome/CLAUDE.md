# Jazzlore — metronome app memory

Sub-site of the Jazzlore portfolio: a web-based metronome scoped to a very
specific real-world problem (iPhone → USB-C → RCA → piano aux input) where
native iOS metronomes drop the leading edge of every click. Lives at
`<https://metronome.jazzlore.com>` (DNS binding is a one-time Cloudflare
dashboard step). See `/CLAUDE.md` at the repo root for workspace-wide
context and conventions.

## App-specific tech

- **Build:** Vite (config at `apps/metronome/vite.config.ts`). Dev port 5176.
- **Routing:** None. Single screen — no router, no settings page. Cloudflare's
  `not_found_handling: "single-page-application"` still routes every URL to
  `index.html`.
- **Audio:** Raw Web Audio (no Tone.js) — the click engine owns its own
  `AudioContext`, with a 30 Hz sub-audible keep-alive oscillator, Chris-Wilson
  25 ms tick / 100 ms lookahead scheduler, two-voice wood-block synthesis
  (sine sweep + filtered noise). `primeAudio()` from `@jazzlore/music-core`
  is called as the **first synchronous statement** of the Start handler — it
  flips `navigator.audioSession.type = 'playback'` (iOS ≥16.4) or runs the
  silent-`<audio>` fallback (pre-16.4), which is the magic bit that keeps the
  USB DAC awake.
- **Wake Lock:** dual strategy — Wake Lock API + NoSleep.js bundled, both
  engaged synchronously in the user gesture before any `await`, both
  released on Stop. `visibilitychange` re-acquires when the page returns to
  the foreground.
- **PWA:** `display: standalone` manifest + Apple meta tags for "Add to Home
  Screen". WKWebView banner detects embedded webviews (Claude iOS, Slack,
  Discord, Instagram, …) where both wake-lock layers silently fail, and
  prompts users to open in Safari.
- **Persistence:** `localStorage` via `@jazzlore/music-core/storage` (keys
  `jazzlore:metronome:bpm`, `…:beats`, `…:pattern`, `…:mode`). Never call
  `localStorage` directly — the storage module enforces the `jazzlore:`
  prefix.
- **Theme:** app-local icon button routed through `applyTheme` /
  `setOverride` / `resolveInitialTheme` from `@jazzlore/music-core`.
  `@jazzlore/ui` `ThemeToggle` is frozen (workspace-wide) and not imported
  here.

## Design source of truth

`apps/metronome/docs/design_handoff_metronome/` is the canonical hi-fi
design bundle:
- `README.md` — interactions, animations, state model, persistence keys,
  Italian-tempo BPM table.
- `original-spec.md` — non-negotiable audio constraints (keep-alive, warmup,
  scheduler, dual wake-lock).
- `app/metronome-styles.css` — every pixel-level value (tokens lifted
  verbatim into `src/styles/theme.css`).
- `app/metronome-components.jsx` — layout structure + conditional rendering
  (mobile vs desktop, idle vs running, modes).
- `screenshots/` — 7 PNGs covering mobile/desktop × light/dark × idle/running.

If the handoff CSS contradicts an existing Jazzlore token, the existing
token wins (the design is built to inherit, not to redefine).

## Source structure (`apps/metronome/src/`)

```
features/
  state/      Reducer + persistence (pure, vitest-covered)
  ui/         All presentational components (Header, BpmHero, Slider, Pattern…)
  audio/      Raw Web Audio engine — keep-alive, scheduler, voices (PR 2)
  wakeLock/   Wake Lock API + NoSleep.js dual strategy + WKWebView detect (PR 2)
  keyboard/   useKeyboardShortcuts hook + tests
lib/          tempo.ts + pattern.ts + useTheme.ts (pure)
pages/        MetronomePage.tsx (single page)
styles/       theme.css (design tokens + .mt-scoped component CSS)
test/setup.ts vitest setup (jest-dom + localStorage polyfill)
```

## Definition of done (per feature)

- [ ] Spec in `apps/metronome/docs/specs/metronome.md` up to date.
- [ ] Unit tests for pure logic (reducer, lib/, scheduler helpers); component
      tests for behavior worth asserting.
- [ ] Renders correctly on mobile (390 wide) and desktop (1280 wide), light
      and dark themes. Side-by-side against the handoff screenshots.
- [ ] Keyboard accessible — every interactive control reachable via the
      documented shortcuts; axe-core 0 violations in both themes.
- [ ] `primeAudio()` is the **first synchronous statement** of every play
      handler. Wake Lock + NoSleep both fire synchronously in the same
      gesture, before any `await`.
- [ ] Lighthouse: perf ≥ 90, a11y ≥ 95.
- [ ] Bundle: initial JS ≤ 100 KB gz (raw Web Audio + no router keeps this
      easy).

## On-device gate (PR 2)

Not catchable in CI / headless — only an on-device iPhone test confirms the
keep-alive stream is working end-to-end through USB-C → RCA → Kawai. The
PR 2 acceptance test is a 5-minute run at 120 BPM with no first-beat drop,
logged in `apps/metronome/docs/diagnostics/on-device-YYYY-MM-DD.md`.

## Out of scope (v1)

Spec-deferred (already listed in `docs/design_handoff_metronome/original-spec.md`):
- Subdivisions (eighths / triplets / sixteenths)
- Multiple sound packs / sound selection
- Setlists, presets, save/recall
- Programmed tempo changes, practice timers
- Random beat dropping
- Volume control (fixed master gain only)

Forward-compatible: `<PatternEditor rows={Row[]}>` accepts N rows — v1 ships
1 row, v2 will add a second for polyrhythms (3-against-2 etc.). Never bake
in a single-row assumption.
