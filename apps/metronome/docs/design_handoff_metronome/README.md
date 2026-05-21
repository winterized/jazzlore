# Handoff: Jazzlore Metronome (v1)

`metronome.jazzlore.com` — a web-based metronome built into Jazzlore,
designed mobile-first for an iPhone plugged into an electronic piano
(iPhone → USB-C → RCA → piano aux). The audio architecture sidesteps
iOS's habit of muting the USB DAC between sounds; this handoff covers
the **UI side** and defers to `original-spec.md` for the
non-negotiable audio constraints.

> **Continuity note** — this metronome is being built by the same
> Claude Code session that already shipped `musicians.jazzlore.com`
> and the rest of the Jazzlore properties. The design system, tokens,
> `packages/ui` primitives, theme-toggle convention, Geist + Geist
> Mono + Newsreader pairing, stone + amber palette — all inherited
> as-is. You won't find any of that re-explained below; this README
> focuses on **what's new for the metronome**.

---

## About the design files

The files in this bundle are **design references created in HTML** —
prototypes showing intended look, behavior, and state. They are not
production code to copy directly. Recreate the designs in the Jazzlore
monorepo using its existing patterns. A new `apps/metronome` package
alongside `apps/musicians` is the natural home; reuse `packages/ui`
(ThemeToggle, header chrome, button primitives) wherever possible.

## Fidelity

**Hi-fi.** All sizes, spacing, weights, letter-spacing, and radii are
committed. The tokens are the existing Jazzlore tokens (no new colors,
no new fonts) — the only token additions are `--accent-line`
(rgba(amber, 0.32)) and `--kbd-bg`, both already declared in
`app/metronome-styles.css` if you want to lift them.

---

## Files in this bundle

- `Jazzlore Metronome exploration.html` — open this in a browser. The
  design-canvas shows the icon-decision matrix at the top and all
  artboards below (pass 1 + pass 2, mobile + desktop, light + dark,
  plus running / tap-armed / alt-measure state variants).
- `screenshots/` — flat PNG references of every artboard, listed below.
- `app/metronome-styles.css` — canonical visual reference. Every
  pixel-level value lives here.
- `app/metronome-components.jsx` — the `<Metronome>` component, with
  inline SVG icons, slider ticks, mode cards, and pattern row.
- `app/metronome-readme.jsx` — the **icon-decision matrix**. The
  *reasoning* behind each glyph pick; read this if you ever want to
  substitute an icon.
- `app/metronome-app.jsx` — design-canvas wrapper; ignore in the
  codebase.
- `design-canvas.jsx` — design-canvas host; ignore in the codebase.
- `original-spec.md` — the user's brief. **Read this first.** Audio
  constraints (keep-alive stream, 400ms warmup, scheduler lookahead,
  Wake Lock + NoSleep.js dual strategy) are non-negotiable.

## Screenshots

Flat PNG references in `screenshots/`:

| File | What it shows |
|---|---|
| `01-mobile-dark-default.png`     | Mobile, dark, idle, 120 BPM, Accent-on-1 |
| `02-mobile-light-default.png`    | Same in light theme |
| `03-mobile-dark-running.png`     | Mobile, dark, running, 144 BPM, 2 & 4 backbeat mode, beat-2 flashing, header status pill lit |
| `04-mobile-light-alt-measure.png`| Mobile, light, running, 108 BPM, 5/4, Bar-on/off mode with the second dimmed "bar 2 — silent" preview row |
| `05-desktop-dark-default.png`    | Desktop, dark, idle — middle column with the keyboard rail (left) and status rail (right) |
| `06-desktop-light-default.png`   | Same in light theme |
| `07-desktop-dark-running.png`    | Desktop, dark, running, 168 BPM, 3/4 |


---

## What this UI is

A single screen. No routes, no settings page. Vertical stack on mobile
(390 wide), the same column re-centered on desktop (1280) with two
side rails for keyboard shortcuts and live status.

Top → bottom:

1. **Sticky header** — `jazzlore / metronome` wordmark · status pill · theme toggle
2. **BPM hero** — giant Geist Mono number, editable, with tempo's Italian name
3. **Tempo slider** — 30–240, ticks every 10 BPM, taller ticks at classic tempos
4. **Nudge row** — `◀◀  −10  −1  +1  +10  ▶▶`
5. **TAP** — full-width dashed button, becomes solid amber when armed
6. **Beats per bar** — 2…7 buttons
7. **Pattern** — N circular dots, three states (empty · click · accent)
8. **Quick patterns** — three mode cards (Accent on 1 · 2 & 4 · Bar on / off)
9. **Start / Stop** — full-width amber, with the play triangle / stop square
10. **Kbd footer** (mobile only) — compact shortcut reference

On desktop, the kbd footer is replaced by a left rail (keyboard
shortcuts) and a right rail (live status: stream state, wake-lock,
scheduler params, warmup).

---

## What's new / what to watch

### BPM hero

Giant number, **Geist Mono 136px on mobile / 196px on desktop**, weight
500, letter-spacing −0.04em, line-height 0.92. Tap to enter edit mode
→ trailing 3×0.78em amber caret blinks at `1s steps(1) infinite`. Enter
commits, Esc cancels, clamps to 30–240.

A `bpm-hero pulse` 10px amber dot sits top-right and animates
`beatpulse 0.5s ease-out` on every beat (scale 1.4 → 1, halo ring
expanding to 14px box-shadow).

Below the number, the suffix shows `BPM  <Italian name>` where the
Italian name is **Newsreader italic 13px** in `var(--accent)`. Mapping:

| BPM | Label | | BPM | Label |
|---|---|---|---|---|
| 30–59 | Largo | | 120–155 | Allegro |
| 60–75 | Adagio | | 156–199 | Vivace |
| 76–107 | Andante | | 200–240 | Presto |
| 108–119 | Moderato | | | |

### Slider

`height 32px; padding 0 4px`. Track 2px `var(--line)`, fill 2px
`var(--accent)`. Ticks every 10 BPM (6px tall, opacity 0.45); classic
tempos (40 60 66 76 108 120 144 168 200) get 10px-tall ticks at
opacity 0.7. Three small labels (60, 120, 168) under the track. Thumb
is an 18px amber circle with a 3px `var(--bg)` border and a 1px amber
box-shadow ring.

### Nudge row

`grid-template-columns: repeat(6, 1fr); gap: 6px`. Each button is
`height 40px; radius 8px; var(--card) background; 1px var(--line)
border; Geist Mono 12px / 500 / letter-spacing −0.01em`. Hover lifts
the border to `var(--accent-line)` and bg to `var(--card-hover)`.

The two classic-stepper buttons (`◀◀`, `▶▶`) carry a 7px monospace tag
`CLASSIC` at `top: 4px; right: 5px; color var(--dim); letter-spacing
0.08em`. That tag is what disambiguates them from `−10` / `+10`.

### TAP

Full-width, `height 44px; radius 10px; 1px dashed var(--line)` border,
transparent. Geist 600 12.5px, letter-spacing 0.22em. Contents:
`TAP` + Geist-Mono 9px hint `tap a few times, last 6 averaged · [T]`.
Armed state (any moment within 2s of last tap): border solid amber,
background `var(--accent-soft)`, text amber.

### Pattern editor — three states, three weights, not three colors

The dot states are **size-stepped, not just colored**. This is the one
spot to be careful with copy-paste.

- **empty** (`data-s="empty"`) — 36px circle, `1.5px dashed var(--dim)` border, no fill.
- **normal** (`data-s="normal"`) — 36px circle, `1.5px solid var(--text-soft)` border, 18px filled inner (`var(--text-soft)`).
- **accent** (`data-s="accent"`) — **42px** circle (size step-up), `1.5px solid var(--accent)` border, `var(--accent-soft)` background, **22px** filled inner amber.

Click cycles `empty → normal → accent → empty`.

Beat flash (during running, when `currentBeat === i`): add class
`.flash` to the dot DOM node. Normal: 0.45s `dotflash` (scale 1.25 →
1, transient accent-soft bg + accent border). Accent: 0.55s
`dotflashAcc` (scale 1.35 → 1, halo expanding to 6px accent-soft
box-shadow then fading to transparent). **Remove the class on
animationend** — flash is purely visual; don't tie it to React state.

The whole pattern lives inside a card: `border 1px var(--line);
border-radius 12px; background var(--bg-soft); padding 16px 14px 14px`,
with a small legend foot below the dots.

**Forward-compatible API**: the pattern component must accept N rows.
v1 always renders 1 row, but v2 will add a second row for polyrhythms
(3-against-2 etc.). Design it as `<PatternEditor rows={Row[]}>`, never
`<PatternEditor pattern={Beat[]}>`. Max rows ever: 2.

### Mode cards — the toggle-untoggle rule

Three cards in `grid-template-columns: repeat(3, 1fr); gap: 6px`. Each:
`border 1px var(--line); background var(--card); radius 10px; padding
10px 10px 9px; min-height 70px; flex column gap 5px`.

- **Accent on 1** — preview `●○○○` — sets `pattern = ['accent', 'normal' × (beats-1)]`. **Untoggles** the moment any dot is edited.
- **2 & 4** — preview `○●○●` — sets `pattern[i] = i % 2 === 1 ? 'normal' : 'empty'`. **Untoggles** on any dot edit.
- **Bar on / off** — preview: two mini bar-containers side by side, second one dashed + 0.35 opacity. **Does not** mutate the pattern. Adds a runtime flag: every other measure plays silent. When this mode is active, render a *second dimmed row* below the live pattern row, opacity 0.35, label `bar 2 — silent`.

Active card (`.on`): background `var(--accent-soft)`, border
`var(--accent)`, label switches to amber, sub becomes
`var(--text-soft)` non-italic. A 6px amber dot at `top: 8px; right:
8px` marks the active card.

"Custom" is the implicit fourth state — when no card is on. Don't
render a fourth card for it; just leave all three off.

### Start / Stop

Full-width, `height 64px; radius 14px`. Idle: amber background, amber
border, and **the only shadow in the whole UI** —
`box-shadow: 0 1px 0 rgba(0,0,0,0.05), 0 10px 32px -10px var(--accent)`
(a soft amber halo). Contents: 20px play SVG + `Start` label (Geist
700, 17px, letter-spacing 0.06em, uppercase) + Geist-Mono 10px kbd
hint `space` at 0.7 opacity.

Running state: transparent background, `var(--text-soft)` border,
`var(--text)` color, no halo, icon swaps to 20px filled square,
label `Stop`.

> **Critical for audio**: per the spec, `AudioContext.resume()` and
> `wakeLock.request()` must happen **synchronously in the gesture
> handler, before any `await`**. NoSleep.js `video.play()` requires
> the user gesture to still be active. Don't await anything until both
> have been kicked off.

### Desktop layout

Same component, `layout="desktop"`. Same sticky header (padding bumped
to `14px 28px`). Below the header, the three-column grid:

```
grid-template-columns: 1fr 580px 1fr
padding: 32px 0 48px
align-items: start
```

The middle column **is the mobile layout** — same vertical stack, same
widths, only the BPM number scales up to 196px. The padding inside the
column drops to 0 because the side rails provide the breathing room.

**Left rail** — `Keyboard` (Geist Mono 9.5px section title) followed
by a list of shortcut rows: kbd-chips on the left, description on the
right. Border-bottom `1px var(--line-soft)` between rows. Below it, a
Newsreader-italic 13px `Notes` paragraph on the mobile-first
rationale.

**Right rail** — mirror, with `Status` title and live system-state
rows (stream, wake lock, scheduler, warmup). Below it, an editorial
`Why a keep-alive` paragraph.

`kbd` chips on desktop get a slightly stronger affordance:
`border-bottom-width: 2px`. The mobile `.kbd-hints` footer is
`display: none` on desktop.

### Status pill

`Geist Mono 9.5px / 0.14em uppercase / var(--muted)`, with a 6px
leading dot. Three states:

| state | text | dot |
|---|---|---|
| `idle` | "idle" | `var(--dim)` |
| `priming` | "priming · 400ms warmup" | amber at 0.6 opacity |
| `running` | "streaming · keep-alive on" | amber with 3px accent-soft halo |

### Status pill (desktop right-rail mirror)

The right rail surfaces the same `status` value but expands it into a
small system-state list. Don't duplicate the header pill at desktop —
keep the pill in the header and let the rail elaborate.

---

## Interactions table

| Control | Pointer | Keyboard | Notes |
|---|---|---|---|
| BPM number | tap → digit keys | digit keys | Enter commits, Esc cancels, clamp 30–240 |
| Slider thumb | drag | — | continuous; snap-on-release optional |
| `−1` `+1` | tap | `←` `→` | repeat-on-hold OK |
| `−10` `+10` | tap | `⇧+←` `⇧+→` | repeat-on-hold OK |
| `◀◀` `▶▶` | tap | `[` `]` | jump to next-lower / next-higher classic tempo |
| TAP | tap | `T` | average last 6, reset after 2s idle, each tap commits |
| Meter (2…7) | tap | `1`–`7` | sets beats-per-bar; truncates / pads pattern to match |
| Pattern dot | tap | — | empty → normal → accent → empty; clears active mode if any |
| Mode card | tap | — | applies pattern (`all`/`backbeat`) or flag (`altmeasure`) |
| Start / Stop | tap | `space` | see audio-engine note above |
| Theme | tap | — | inherit Jazzlore-wide preference |

Animations: 0.45s `ease-out` dot flash (0.55s for accent), 0.5s
`ease-out` BPM-pulse on every beat, 0.12s on every hover. 1s
`steps(1) infinite` BPM-edit caret blink. Never `ease-in-out`
anywhere.

---

## State

```ts
type BeatState = 'empty' | 'normal' | 'accent';
type Mode = 'all' | 'backbeat' | 'altmeasure' | 'custom';

type MetronomeState = {
  bpm: number;            // 30..240
  beats: number;          // 2..7
  pattern: BeatState[];   // length === beats
  mode: Mode;
  bpmEditing: boolean;
  tapArmed: boolean;
  status: 'idle' | 'priming' | 'running';
};
```

**Don't put `currentBeat` in React state** — it updates ~120/min and
you don't want to re-render the whole component on every beat. Keep
it in a ref. The scheduler calls `flashDot(i)` which adds `.flash` to
the dot DOM node and removes it on `animationend`. Same for the
BPM-hero pulse.

**Persistence** (localStorage):
- `jl.metronome.bpm`
- `jl.metronome.beats`
- `jl.metronome.pattern`
- `jl.metronome.mode`

Theme inherits the existing Jazzlore preference. Status never persists.

When `beats` changes, pad `pattern` with `'normal'` or truncate. When
a quick-mode is active and the user changes `beats`, **reapply the
mode** rather than untoggle it.

---

## What this handoff does NOT redefine

Inherited from the existing Jazzlore session:

- Tokens (stone palette, amber accent, light + dark anchors — same
  values the musicians app already uses; see `musicians3-styles.css`
  lines 11–55 for the canonical set, mirrored verbatim in
  `metronome-styles.css` lines 9–48).
- Fonts (Geist + Geist Mono + Newsreader, same Google Fonts import).
- ThemeToggle component (use the existing one).
- Header chrome (`backdrop-filter: blur(14px) saturate(140%)`, sticky,
  bottom-border `1px var(--line)` — same as musicians).
- `kbd` chip styling, status-dot animation, accent-soft halo treatment.

If anything in `metronome-styles.css` contradicts the existing
Jazzlore tokens, the existing tokens win.

---

## v1 scope (don't do these)

From the spec, deferred to later passes:
- Subdivisions (eighths / triplets / sixteenths)
- Sound packs
- Setlists, presets, save/recall
- Programmed tempo changes, practice timers
- Random beat dropping
- Volume control (fixed master gain only)

Forward-compatible: pattern component takes N rows (1 for v1, 2 for v2
polyrhythms). Never bake in a single-row assumption.

---

## Implementation checklist (metronome-specific)

- [ ] Read `original-spec.md` end-to-end — audio constraints first.
- [ ] Build the `<Metronome>` shell. Get the static UI right at mobile
      + desktop, light + dark, before wiring audio.
- [ ] `useReducer` for `MetronomeState`; hook every control.
- [ ] Keyboard shortcuts (`space`, `T`, `←` `→`, `⇧+←` `⇧+→`, `[` `]`, `1`–`7`).
- [ ] localStorage persist + rehydrate.
- [ ] Port the Web Audio engine from the POC. Connect `currentBeat`
      ref + `flashDot(i)` callback.
- [ ] Wake Lock + NoSleep.js dual strategy, both engaged synchronously
      on Start. `visibilitychange` re-acquires.
- [ ] WKWebView detection → header banner prompting "open in Safari /
      Add to Home Screen."
- [ ] PWA manifest for the standalone context.
- [ ] Side-by-side check against `Jazzlore Metronome exploration.html`.

The canonical answers for visual values are in
`app/metronome-styles.css`. The canonical answers for layout structure
and conditional rendering are in `app/metronome-components.jsx`. The
canonical answers for *why* each icon is the icon it is are in
`app/metronome-readme.jsx`.
