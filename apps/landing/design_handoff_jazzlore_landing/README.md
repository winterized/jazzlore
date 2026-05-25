# Handoff — Jazzlore Landing (the gate)

## Overview
Landing page for **jazzlore.com** — the identity-level front door that ties four jazz tools into one personal collection. The page's only job is to make a visitor see all four tools at once, feel pulled to click one, and click out into a subdomain. **This is a gate, not an essay.**

Four apps live on subdomains; this page introduces them:
- **musicians.jazzlore.com** — explore who played with whom *(the heart — the idea the site orbits)*
- **scales.jazzlore.com** — 38 jazz scales (notation, piano, audio)
- **chords.jazzlore.com** — jazz chord voicings, dual-form notation
- **metronome.jazzlore.com** — a metronome that holds steady over USB-C

The hierarchy is honest: Musicians is the dominant tile (~57% of canvas). Scales, Chords, Metronome are smaller secondary tiles.

## About the design files
The files in this bundle are **design references created in HTML/JSX** — a working hi-fi prototype showing intended look, layout, and behavior. **Don't ship the HTML.** Recreate the design in the existing monorepo using its established stack: **Vite + React + Tailwind + Cloudflare Pages**, the same shape as the sibling apps (musicians / scales / chords / metronome). Pull the `<ThemeToggle>` and any shared primitives from `packages/ui` so clicking into any app is seamless.

## Fidelity
**High-fidelity.** Pixel-perfect mockups with final palette, typography, layout, and motion. Implement to match — but use the monorepo's existing design tokens (`packages/ui` colors, shared Tailwind config) rather than re-declaring values from the prototype. The hex values listed below are reference; if the existing design system has near-equivalents, prefer those.

## Screens / Views

### One page, two viewports

Single-route page (`/`) with two breakpoints. **No scroll on desktop above the fold — this is the most important constraint.**

| | Desktop (≥1024px) | Mobile (<768px) |
|---|---|---|
| Canvas | 1280 × 800 fixed (everything visible) | 390 × 844 (designed; flexes responsively) |
| Layout | 2-column grid: Musicians left, 3 tools stacked right | 1 column: Musicians top, 3 small tools in a row below |
| Tile subdomains | All 4 tiles show subdomain top-right | Musicians only (small tiles have nothing top-right) |

### Layout — Desktop (1280 × 800)

```
┌─ Header (28px top pad, 56px side pad) ─────────────────────────────────┐
│ ● Jazzlore  A WORKBENCH                              About  [Theme]  │
├─ Plain header line (14px-18px vertical) ──────────────────────────────┤
│ A jazz musician's workbench — explore who played with whom, and       │
│ practise with scales, chords, and a metronome.                        │
├─ Grid (56px side pad, 28px bottom pad, 16px gap) ─────────────────────┤
│ ┌──────────────────────────────┐ ┌────────────────────────┐          │
│ │                              │ │ SCALES   scales.jazz…  │          │
│ │  MUSICIANS                   │ │ Lydian Dominant        │          │
│ │  ● musicians.jazzlore.com    │ │ ████ staff strip ████  │          │
│ │                              │ │ 38 modes…       Open ↗ │          │
│ │  [graph: Miles + quintet]    │ ├────────────────────────┤          │
│ │                              │ │ CHORDS   chords.jazz…  │          │
│ │                              │ │ Cm7♭5   half-diminished│          │
│ │                              │ │ ████ dots-on-staff ███ │          │
│ │  Who played with whom.       │ │ voicings…       Open ↗ │          │
│ │  12,847 musicians  84k sess. │ ├────────────────────────┤          │
│ │  1917–2024            Open↗  │ │ METRONOME metronome…   │          │
│ │                              │ │ 96 BPM    4/4 ♩ stable │          │
│ └──────────────────────────────┘ │ ● ● ● ●         Open ↗ │          │
│                                  └────────────────────────┘          │
├─ Footer (10px mono, 0.16em tracking, t.faint color) ──────────────────┤
│ jazzlore.com · mmxxvi                       Source · Colophon         │
└────────────────────────────────────────────────────────────────────────┘
```

**Grid dimensions:**
- Outer page padding: `56px` horizontal, `28px` top header / `28px` bottom
- Grid columns: `720px 1fr` (left=Musicians, right=tools column)
- Grid gap: `16px`
- Musicians tile: `720 × 620` (border-box, padding-inclusive)
- Each tool tile in right column: full column width × `196px` tall, gap `16px`

**ALL widths and heights use `box-sizing: border-box`.** This is required — the explicit `w`/`h` props on tile components include padding. Add `*, *::before, *::after { box-sizing: border-box; }` at the page level.

### Layout — Mobile (390 × 844)

```
┌─ Header (18px top, 20px side) ─────────────┐
│ ● Jazzlore A WORKBENCH    About  [Theme]   │
├─ Header line (10-14px vertical) ───────────┤
│ A jazz musician's workbench —              │
│ explore who played with whom…              │
├─ Grid (20px side, 16px bottom, 10px gap) ──┤
│ ┌────────────────────────────────────────┐ │
│ │ MUSICIANS  musicians.jazzlore.com      │ │
│ │ [compact graph]                        │ │
│ │ Who played with whom.    Open ↗        │ │
│ │ 350 × 420                              │ │
│ └────────────────────────────────────────┘ │
│ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│ │ SCALES  │ │ CHORDS  │ │ METRONOME  │   │
│ │         │ │         │ │            │   │
│ │ [tiny]  │ │ [tiny]  │ │ [tiny]     │   │
│ │  Open ↗ │ │  Open ↗ │ │  Open ↗    │   │
│ │ 111×158 │ │ 111×158 │ │ 111×158    │   │
│ └─────────┘ └─────────┘ └─────────────┘   │
├─ Footer (9px mono) ────────────────────────┤
│ jazzlore · mmxxvi   Source · Colophon      │
└────────────────────────────────────────────┘
```

**Mobile subdomain rule (do not violate):** Musicians tile **shows** `musicians.jazzlore.com` top-right. The three small tiles **must show nothing** in the top-right corner of their chrome — no subdomain, no metadata. They cram and clip otherwise.

## Components

### Header
- Wordmark: `Jazzlore` in Newsreader 22px (desktop) / 18px (mobile), `fontWeight: 500`, `letterSpacing: -0.012em`. Prefixed with a `10px × 10px` amber dot (`#b45309` light / `#fbbf24` dark).
- Mono tagline beside wordmark: `"a workbench"` — Geist Mono 10px, `letterSpacing: 0.20em`, `text-transform: uppercase`, color `t.faint`. Margin-left `12px`.
- Right side: `About` button (mono, 11px desktop / 10px mobile, `letterSpacing: 0.18em`, uppercase, color `t.muted`) + `<ThemeToggle>`.
- Gap between About and toggle: `28px` desktop / `16px` mobile.

### Header line (the explanation)
- **Exact copy** (no quote marks, no italic — utilitarian sans):
  > A jazz musician's workbench — explore who played with whom, and practise with scales, chords, and a metronome.
- Geist 15.5px desktop / 13.5px mobile, color `t.muted`, `letterSpacing: -0.005em`, `max-width: 800px` desktop.
- Padding `14px 56px 18px` desktop / `10px 20px 14px` mobile.

### Tile chrome (all 4 tiles)

A single header row with bottom border:
- Padding: `14px 18px` desktop, `10px 12px` mobile
- `border-bottom: 1px solid {pal.border}`
- Left side: animated pulse dot (8×8 circle, `pal.cta` background, `jzl-pulse-soft 2.4s ease-in-out infinite`) + title in Geist Mono 11px/10px, `letterSpacing: 0.20em`, uppercase, color `pal.fg`
- Right side (only when there's a `sub`): subdomain in Geist Mono 10px/9px, `letterSpacing: 0.16em`, uppercase, color `pal.faint`

**Subdomain values by tile:**
| Tile | Desktop sub | Mobile sub |
|---|---|---|
| Musicians | `musicians.jazzlore.com` | `musicians.jazzlore.com` |
| Scales | `scales.jazzlore.com` | *(none)* |
| Chords | `chords.jazzlore.com` | *(none)* |
| Metronome | `metronome.jazzlore.com` | *(none)* |

### Musicians tile (hero)

Inner layout: `header chrome` → relative graph area → bottom block with title + stats + CTA.

**Graph (ConstellationLarge):** SVG, draws nodes and edges from a hand-placed dataset. Five named nodes (the First Great Quintet) plus 11 anonymous nodes for density.

Named nodes (positions in normalized 0–1 coords on the SVG):
| Index | Name | Position | Radius | Notes |
|---|---|---|---|---|
| 0 | Miles Davis | (0.42, 0.50) | 12 | Hero — pulses with `jzl-pulse-2 2.4s ease-in-out infinite`. Label to the right. |
| 1 | John Coltrane | (0.22, 0.18) | 8 | Label above. |
| 2 | Red Garland | (0.66, 0.20) | 8 | Label to right. |
| 3 | Paul Chambers | (0.74, 0.78) | 8 | Label below. |
| 4 | Philly Joe Jones | (0.18, 0.78) | 8 | Label below. |

Anonymous nodes — see `shared.jsx > ConstellationLarge > A` array (11 entries).

Edges have 3 weights:
- **Strong** (`stroke-opacity: 0.65`, width 1.0) — Miles to each quintet member
- **Medium** (0.35, 0.8) — among quintet + quintet to nearby anonymous
- **Faint** (0.15, 0.6) — anonymous-to-anonymous (dropped in non-dense mode)

Each node has a `t.duoBg` halo behind a `t.duoFg` dot. Quintet halos are larger and more opaque (`+6` radius, opacity 0.95) than anonymous (`+4` radius, opacity 0.7).

Labels: Geist Mono ~10.5px, `letterSpacing: 0.04em`, fill `t.duoFg`, opacity 0.95 (hero) / 0.78 (others).

**Bottom block:**
- H2 title: `"Who played with whom."` — Newsreader, weight 400, 44px desktop / 28px mobile, `letterSpacing: -0.022em`, `lineHeight: 1.0`
- Stats row (Geist Mono 11px desktop / 9.5px mobile, `letterSpacing: 0.14em`, uppercase, `pal.mute`): `12,847 musicians   84k sessions   1917–2024` with values colored `pal.fg`
- `<OpenCta>` right-aligned

### Scales tile
- Inner flex column. Three sections separated by `gap: 8px` desktop / `6px` mobile.
- **Title block:**
  - Title: `"Lydian Dominant"` (desktop) / `"Lydian Dom."` (mobile) — Newsreader italic, 24px / 15px, `lineHeight: 1.0`, `letterSpacing: -0.018em`
  - Subtitle (desktop only): `"C · Mixolydian ♯11"` — Geist Mono 10px, `letterSpacing: 0.14em`, uppercase, color `pal.mute`
- **Staff strip:** `flex: 1`, `background: pal.duoBg`, padding `6px 12px` / `4px 8px`. Holds `<ScaleStaffMini>` (5-line staff with 7 ascending noteheads) plus a circular play button on the right (18px desktop / 12px mobile, `pal.cta` background, `jzl-pulse-soft 1.6s` animation, white "▶" triangle inside).
- **Bottom row:** `"38 modes · notation · audio"` caption left (desktop only) + `<OpenCta>` right.

### Chords tile
- **Title block:** `Cm7♭5` rendered with the `m` in `pal.cta` color and `♭5` at 0.7em size. Newsreader 30px / 19px, `letterSpacing: -0.02em`. Beside it (desktop only): `half-diminished` in Newsreader italic 15px, color `pal.mute`.
- **Dots-on-staff strip** (the chords.jazzlore.com style): `<ChordDotsStaff>` — treble clef + 5-line staff + 4 filled circles stacked at chord positions:
  - `C4` (below staff, leger line)
  - `E♭4` (bottom line, flat accidental left)
  - `G♭4` (4th line up, flat)
  - `B♭4` (middle line, flat)
  - Flat symbols rendered in Newsreader serif sized `lineGap × 1.6`
  - Note name labels (`C / E♭ / G♭ / B♭`) on the right in Geist Mono, hidden when `compact={true}` (mobile)
  - Each dot pulses on a `0.18s` stagger via `jzl-pulse-soft 2.6s ease-in-out infinite`
- **Bottom row:** `"voicings · two notations"` caption (desktop only) + `<OpenCta>`.

### Metronome tile
- **Reading + pendulum row** (`flex: 1`):
  - Big BPM number: `"96"` Newsreader 56px / 32px, `lineHeight: 0.9`, `letterSpacing: -0.025em`. Inline mono `"bpm"` at 11px / 8.5px, `letterSpacing: 0.18em`, uppercase, color `pal.mute`.
  - Below: `"4/4"` and (desktop only) `"♩ stable"` separated by a 4×4 dot, all Geist Mono 11px / 8.5px.
  - Right side: `<MetronomeBeatMini>` — pendulum SVG (line + rect counterweight + dot), animated with `jzl-swing 1.0s ease-in-out infinite` rotating from -22° to +22°. Size 96 desktop / 60 mobile.
- **Beat dots + Open row:**
  - Four small circles (9×9 / 6×6, `pal.duoFg`) with staggered `jzl-tick` animation (0.3s delay each, 1.2s loop) that pulses one beat brighter at a time
  - `<OpenCta>` right

### `<OpenCta>` (shared by all tools)
```
Open  ↗
___
```
- Mono 11px (or 10px small), `letterSpacing: 0.20em`, uppercase, color `pal.cta`
- Followed by `<ArrowOut>` — a 10px outline arrow ↗ icon
- Underneath: a 1px line that's `width: 18px` at rest and animates to `width: 100%` on tile hover (`.jzl-tile:hover .jzl-cta-underline { width: 100% !important }`)

### `<ArrowOut>` (the ↗ icon, reusable)
Tiny outline arrow. On `.jzl-tile:hover` it translates `(4px, -4px)` over 0.35s `cubic-bezier(.2,.7,.3,1)`.

### `<ThemeToggle>` ⚠️ Use the shared component
**The page must use the same `<ThemeToggle>` from `packages/ui` that the four sibling apps use.** Do NOT reimplement the toggle locally — zero seam between this page and clicking into any app is the whole point. The prototype contains a placeholder (`SharedThemeToggle` in `shared.jsx`) with a sun/moon icon button — visual reference only. Replace with the real import.

Expected behavior: click toggles between light and dark, persists to wherever the apps persist their theme (probably `localStorage` key shared across subdomains, or a cookie scoped to `.jazzlore.com`).

### About overlay
Triggered by clicking the `About` button in the header. Modal overlay (`position: absolute; inset: 0; z-index: 50; background: rgba(10,8,6,0.55)`, `backdrop-filter: blur(2px)`). Click outside the panel to dismiss.

Panel:
- Background `t.bg`, border `1px solid {t.rule}`, max-width 640px desktop / full-width mobile
- Padding `52px 56px 44px` desktop / `32px 24px 28px` mobile
- Close `×` button top-right (28×28, color `t.muted`, mono 22px)
- Eyebrow: `● About` — Geist Mono 10.5px, `letterSpacing: 0.24em`, uppercase, color `t.muted`. The dot is `pal.cta`.
- Body (Newsreader, color `t.ink`, 22px / 17px, `lineHeight: 1.55`):
  > I built these tools for myself, for my practice as an amateur, not-very-good jazz pianist. *Musicians is different* — it's an exploration device I'd wanted to build for a long time, because I believe human relationships are the core of jazz, as they are of many things in life.
  >
  > *This is personal; it doesn't aspire to be the right fit for everyone.*
- The phrase `Musicians is different` is italicized and colored `t.accent`.
- Second paragraph (`t.muted`, italic, 18px / 14.5px) styled as a quieter coda.
- **Don't paraphrase the text.** It's verbatim from the maker.

### Footer
- Padding `0 56px 18px` desktop / `0 20px 14px` mobile
- Geist Mono 10px / 9px, `letterSpacing: 0.16em` / `0.14em`, uppercase, color `t.faint`
- Three slots: `jazzlore.com · mmxxvi` left, `Source · Colophon` right (links — leave hrefs `#` for now, attribution + repo links go here later)

## Interactions & Behavior

### Tile hover (desktop only — touch devices: skip)
- Tile: `transform: translateY(-3px)` over 0.35s
- ↗ arrow inside: `transform: translate(4px, -4px)`
- Open CTA underline: width 18px → 100%
- All animated with `cubic-bezier(.2, .7, .3, 1)`

### Tile click
- Each `<Tile>` is an `<a href>`. On click, navigate to the subdomain — full-page navigation (these are separate apps). Open in the same tab.

### Theme toggle
Click flips light ↔ dark. Use the shared `<ThemeToggle>` — the apps already persist this; the landing should respect the same persisted state on load.

### About overlay
- Click `About` → opens overlay
- Click backdrop → closes
- Click `×` close button → closes
- `Esc` key → closes (not implemented in the prototype, add this)

### Live motion (always on)
| Element | Animation |
|---|---|
| Miles node in graph | `jzl-pulse-2 2.4s ease-in-out infinite` (scale 1 → 1.25) |
| All chrome status dots | `jzl-pulse-soft 2.4s` (opacity 0.55 → 1) |
| Chord-tone dots (4 of them) | `jzl-pulse-soft 2.6s` staggered 0.18s |
| Play button in Scales tile | `jzl-pulse-soft 1.6s` |
| Metronome pendulum | `jzl-swing 1.0s` rotating -22° ↔ +22° |
| Metronome beat dots (4) | `jzl-tick 1.2s steps(2, end)` staggered 0.3s |

Respect `prefers-reduced-motion: reduce` — if set, kill all the loop animations (keep tile hover transition, since that's user-initiated).

## State management

Minimal — this is a static page.

```ts
const [aboutOpen, setAboutOpen] = useState(false);
const [dark, setDark] = useTheme();   // from packages/ui shared hook
```

No data fetching. No forms. No routing beyond the four external links.

The stat numbers on the Musicians tile (`12,847 musicians`, `84k sessions`, `1917–2024`) are **hardcoded placeholder copy** in the prototype. If you want them live, wire them to whatever the musicians backend exposes — but they should still feel calm and rounded, not jittery realtime data.

## Design tokens

Use the monorepo's existing token system. The prototype's hex values, for reference:

### Colors

**Light theme**
```css
--bg:        #faf8f4;   /* warm near-white */
--bg-alt:    #f1ece1;
--surface:   #ffffff;
--ink:       #1c1917;   /* stone-900 */
--ink-soft:  #3f3a36;
--muted:     #78716c;   /* stone-500 */
--faint:     #a8a29e;   /* stone-400 */
--rule:      #e7e2d6;
--accent:    #b45309;   /* amber-700 */
--accent-soft: #92400e;
--duo-bg:    #e8d3a0;   /* amber wash for tile motifs */
--duo-fg:    #1c1917;
```

**Dark theme**
```css
--bg:        #0e0c0a;
--bg-alt:    #161311;
--surface:   #1c1917;
--ink:       #f5f5f4;
--ink-soft:  #d6d3d1;
--muted:     #a8a29e;
--faint:     #78716c;
--rule:      #2a2622;
--accent:    #fbbf24;   /* amber-400 */
--accent-soft: #f59e0b;
--duo-bg:    #2a2218;
--duo-fg:    #fbbf24;
```

### Tile palettes (per-tile, derived from theme)
See `widgetPalette()` in `gate-launcher.jsx`. Each tile gets:
- `bg`, `fg`, `mute`, `faint`, `border`
- `duoBg`, `duoFg` (for motif SVGs)
- `cta` (accent color), `accentDim`

### Typography
- **Sans** — `"Geist"` (Google Fonts), weights 400 and 500
- **Mono** — `"Geist Mono"`, weight 400
- **Serif** — `"Newsreader"`, weights 400 + italic 400

Load via:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400&family=Newsreader:ital,wght@0,400;1,400&display=swap" />
```

Size scale used (rough):
| Use | Size |
|---|---|
| Hero H2 ("Who played with whom.") | 44px desktop / 28px mobile |
| Tile titles ("Lydian Dominant", "Cm7♭5") | 24–30px / 15–22px |
| BPM big number | 56px / 32px |
| Body / explanation line | 15.5px / 13.5px |
| Mono small caps (subdomains, eyebrows) | 10–11px / 9–10px |

### Spacing
Uses the monorepo's Tailwind scale. Common values: `8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 28 / 36 / 56` px.

### Radius / borders
- Tile border: `1px solid` (var color)
- Theme toggle border: `1px solid {rule}`, border-radius `8px`
- No drop shadows on tiles in the resting state. Hover gets `transform: translateY(-3px)` (no extra shadow).

## Assets
All visuals are inline SVG drawn from primitives (circles, lines, rects, text). **No raster images, no external icon files.** Marks shipped:

- `<ConstellationLarge>` — Musicians graph
- `<ScaleStaffMini>` — Scales tile staff
- `<ChordDotsStaff>` — Chords tile dots-on-notes
- `<MetronomeBeatMini>` — Metronome pendulum
- `<ArrowOut>` — ↗ external-link arrow icon

Plus the theme-toggle sun/moon (placeholder — use shared `<ThemeToggle>` instead).

Fonts come from Google Fonts (Geist / Geist Mono / Newsreader). The monorepo may already self-host these — prefer that.

## Files
Design source (JSX, hi-fi prototype):
- `shared.jsx` — theme tokens, fonts, all SVG marks (`ConstellationLarge`, `ScaleStaffMini`, `ChordDotsStaff`, `MetronomeBeatMini`), the `SharedThemeToggle` placeholder, `ArrowOut`, and global keyframes
- `gate-launcher.jsx` — `LauncherDesktop`, `LauncherMobile`, `MusiciansWidget`, `ScalesWidget`, `ChordsWidget`, `MetronomeWidget`, `WidgetChrome`, `OpenCta`, `AboutOverlay`, `HeaderRow`

Standalone preview (single file, opens in any browser — shareable):
- `jazzlore-gate.html` — bundled, self-contained, 375KB. Pan/zoom canvas presenting all four artboards (Desktop · Light, Desktop · Dark, Mobile · Light, Mobile · Dark) side by side.

Source canvas (dev environment, requires the JSX siblings):
- `index.html` — the dev preview with hot-reload-style script tags. Loads the `.jsx` files.

## Build notes (from the maker)
- Lives in the monorepo as a sibling static page (Vite + React + Tailwind + Cloudflare Pages — same shape as scales/chords/musicians/metronome).
- The page goes at the root of `jazzlore.com` (currently empty).
- Pull `<ThemeToggle>` from `packages/ui`. Same component the four apps use.
- The "About" overlay and personal copy stay verbatim — that voice is intentional.
- The design IS the spec. Mocks ship with no further design review; just build it.
