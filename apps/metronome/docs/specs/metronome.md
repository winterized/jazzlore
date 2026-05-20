# Metronome — v1 spec (in-repo)

> The canonical hi-fi design lives in `apps/metronome/docs/design_handoff_metronome/`
> (README, original-spec, hi-fi CSS, component reference JSX, screenshots).
> This file is the in-repo spec — the version-controlled summary the team
> works against. If a value here disagrees with the handoff, the handoff
> wins for visual values; this file wins for behavior + boundaries.

## Why this exists

When an iPhone outputs audio over USB-C to a piano, iOS lets the USB audio
stream idle between sounds. Apps that emit short isolated clicks — most
native iOS metronomes — lose the leading edge of every click because the
DAC hasn't woken up. Apps with continuous audio (iRealPro etc.) work fine
because their stream never goes silent.

`metronome.jazzlore.com` sidesteps this with a sub-audible keep-alive
oscillator running from Start to Stop so the DAC never sleeps. The POC
validates this on iPhone (Chrome iOS / Safari) into a Kawai over
USB-C → RCA.

## Hard technical constraints (non-negotiable)

1. **Keep-alive stream** — a continuous 30 Hz oscillator at ~0.0008 gain
   runs from Start to Stop.
2. **400 ms warmup** — first beat fires 400 ms after Start, not
   immediately, so the DAC is fully streaming before the first click.
3. **Web Audio scheduler with lookahead** — Chris-Wilson pattern, ~25 ms
   scheduler tick, ~100 ms lookahead. Not `setInterval` triggering clicks.
4. **User gesture to start** — `AudioContext.resume()` and
   `wakeLock.request()` are called **synchronously in the user-gesture
   handler, before any `await`**. `primeAudio()` from
   `@jazzlore/music-core` is the FIRST sync statement of that handler.
5. **Dual Wake Lock** — Wake Lock API + NoSleep.js, both engaged on Start,
   both released on Stop. `visibilitychange` re-acquires when the page
   returns to foreground.

## Feature surface (v1)

- **Tempo**: 30–240 BPM. Slider, ±1 / ±10 nudges, classic-tempo jump
  (40, 60, 66, 76, 108, 120, 144, 168, 200), tap tempo (last-6 rolling
  average, 2 s reset), direct-edit by tapping the giant BPM number.
- **Meter**: 2–7 beats per bar.
- **Pattern**: each beat is empty / normal / accent, cycled by tapping the
  dot. Pattern length follows beats (pad with 'normal' on grow, truncate
  on shrink).
- **Quick patterns**:
  - *Accent on 1* — `['accent', 'normal' × (beats-1)]`
  - *2 & 4* (backbeat / jazz feel) — odd-indexed beats click, even silent
  - *Bar on / off* — measure-level: every other measure plays silent,
    pattern unchanged. UI mounts a second dimmed "bar 2 — silent" preview
    row.
- **Wood-block voice**: pitched sine sweep + filtered noise transient.
  Two voices (accented + unaccented). Fixed master gain (no volume control
  in v1).
- **Visual beat indicator**: dots flash on each beat, accent dots pulse
  more visibly. Important for deaf-accessibility.
- **Status pill**: idle / priming (400 ms warmup) / running (keep-alive on).
- **Screen wake**: held while running.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `space` | start / stop |
| `T` | tap tempo |
| `←` / `→` | ±1 BPM (repeat-on-hold) |
| `⇧+←` / `⇧+→` | ±10 BPM (repeat-on-hold) |
| `[` / `]` | previous / next classic tempo |
| `1`–`7` | set beats per bar (2..7 only; 1 ignored) |
| digit keys when editing | accumulate; Enter commits, Esc cancels |

Shortcuts no-op when focus is in an `<input>` / `<textarea>` /
contentEditable.

## State + persistence

State model documented in `apps/metronome/src/features/state/metronomeReducer.ts`.

Persisted (via `@jazzlore/music-core/storage` — `jazzlore:` prefix
enforced):

- `jazzlore:metronome:bpm` (number, 30..240)
- `jazzlore:metronome:beats` (integer, 2..7)
- `jazzlore:metronome:pattern` (array of `'empty' | 'normal' | 'accent'`,
  length === beats)
- `jazzlore:metronome:mode` (`'all' | 'backbeat' | 'altmeasure' | 'custom'`)

Each key falls back to v1 defaults independently if malformed. Pattern
length is reconciled with beats on load (truncate or pad with 'normal').

Defaults: `bpm: 120, beats: 4, pattern: ['accent','normal','normal','normal'], mode: 'all'`.

Status (idle / priming / running) is volatile (not persisted).
Theme inherits the workspace-wide `jazzlore:theme:v1`.

## Italian tempo labels

| BPM | Label | | BPM | Label |
|---|---|---|---|---|
| 30–59 | Largo | | 120–155 | Allegro |
| 60–75 | Adagio | | 156–199 | Vivace |
| 76–107 | Andante | | 200–240 | Presto |
| 108–119 | Moderato | | | |

Lower-inclusive, upper-exclusive (60–75 means [60, 76)).

## Out of scope for v1

Spec-deferred (already listed in `docs/design_handoff_metronome/original-spec.md`):

- Subdivisions (eighths / triplets / sixteenths)
- Multiple sound packs / sound selection
- Setlists, presets, save/recall
- Programmed tempo changes, practice timers
- Random beat dropping ("gap click" mode)
- Volume control (fixed master gain only)

Forward-compatible: `<PatternEditor rows={Row[]}>` accepts N rows — v1
ships 1 row, v2 adds a second for polyrhythms (3-against-2, 3-against-4,
4-against-5). Maximum 2 rows ever.

## Success criteria

1. Every click audible on the validated hardware path (iPhone USB-C → RCA →
   Kawai). No first-beat drop, no random missed beats over a 5-minute session.
2. Timing jitter under ~5 ms at 120 BPM.
3. Works in Chrome iOS and Safari iOS. Desktop Chrome / Safari / Firefox as bonus.
4. Loads fast — initial JS ≤ 100 KB gz, no audio sample files (all synthesized).
5. axe-core: 0 violations on every public state in both light and dark themes.
6. Lighthouse: perf ≥ 90, a11y ≥ 95.

## Frozen contracts

- `@jazzlore/ui` `ThemeToggle` is workspace-frozen — the metronome renders
  its own `.ic` icon button instead (routed through music-core's
  `applyTheme` + `setOverride` + `resolveInitialTheme`).
- `@jazzlore/music-core/storage` is the only `localStorage` seam — never
  call `localStorage` directly.

## Implementation plan

`apps/metronome/docs/plans/2026-05-20-v1-build.md` — two-PR plan: PR 1
static UI + state + keyboard; PR 2 audio engine + Wake Lock + NoSleep +
PWA + WKWebView banner + deploy.
