# Jazzlore Musicians — figure-redraw contract

Drop-in contract for the 14 instrument figures shown in `figures-current.svg`
and listed verbatim in `figures-source.md`. Any redraw that satisfies this
contract pastes straight back into `FIG_LIB` (`apps/musicians/src/components/noPhotoFigures.tsx`)
without further wiring changes.

## What's being redrawn (and why)

The figures appear inside a musician's tile when no portrait is available
(roughly a few hundred sidemen in the dataset). They're keyed off the
musician's primary instrument via a `figKey()` resolver. They render at five
different tile sizes — 32px through ~250px — with stroke width and padding
tuned per render context via CSS. So a single drawing has to read cleanly
across that whole range.

The redraw target is purely artistic. The existing geometry (the way the
figure sits in the box, where the head is, where the feet are) needs to
hold so the existing per-context CSS keeps working — the rules below pin
that geometry.

## Required output format

For each figure, produce **inner SVG markup only** — `line`, `path`,
`circle`, `ellipse`, `rect` elements. The wrapper `<svg>` is supplied by
the runtime; do not include it in your output. The wrapper is:

```html
<svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMax meet">
  <!-- your figure markup here -->
</svg>
```

## Viewbox & alignment

| Constraint | Value |
|---|---|
| `viewBox` | exactly `0 0 100 140` |
| `preserveAspectRatio` | `xMidYMax meet` (figure bottom-aligned in the cell) |
| Head position | head ellipse / outline near `y ≈ 18–24` |
| Feet position | foot ticks at `y ≈ 134` (the rest figure goes to `y 134` too) |
| Vertical extent | use the full 140 units of height |
| Horizontal extent | use the full 100 units of width — do not crop to a centred 60-unit strip |

The figure should fill the box. Empty margins shrink the figure at small
render sizes.

## Class contract (NO inline styling)

Strokes, fills, and stroke-widths come from CSS at runtime. Your markup
must NOT bake any of them in.

| Class | Purpose | What CSS gives it |
|---|---|---|
| `.ln` | Single-weight line strokes — the body of every figure | `stroke: currentColor` (set via `color-mix(in srgb, var(--duo-hi) 82%, white)`), `fill: none`, `stroke-linecap: round`, `stroke-linejoin: round`, `stroke-width` tuned per context (range **2 → 4.5**) |
| `.dot` | Filled circle accents — valve dots, eye-suggestion dots, mallet heads, etc. | `fill: currentColor`, `stroke: none` |
| `.keyfill` | Semi-transparent panel fills — black keys on piano/organ keyboards | `fill: color-mix(in srgb, var(--duo-hi) 60%, white)`, `fill-opacity: 0.22`, `stroke: none` |

**Forbidden in the inner markup:**
- `stroke="…"` (any color)
- `stroke-width="…"` (any width — runtime sets it)
- `fill="…"` on stroked elements (they must be transparent — `.ln` already implies `fill: none`)
- `style="…"` attributes
- `<defs>` / `<linearGradient>` / `<filter>` / `<mask>` (overhead, no win, and clashes with the `currentColor` theming)

**Allowed per-element attributes:**
- `opacity="…"` (used today to soften secondary detail — see the bass strings)
- `transform="rotate(…) | translate(…) | scale(…)"`
- Geometric attributes (`cx/cy/r/rx/ry/x1/y1/x2/y2/d/x/y/width/height`)
- `class="ln" | "dot" | "keyfill"`

## Style — single-weight line drawing

The current set is a **single-weight line drawing** with light dot-accent
details. Keep that tone:

- One visual weight throughout. The CSS sets a single `stroke-width` per
  context; everything stroked reads as the same line.
- Use `.dot` sparingly for valve buttons, mallet heads, etc. — never as a
  primary structural element.
- Avoid hatching, cross-hatching, or any pattern that depends on multiple
  closely-spaced strokes — at 32px (the sticky-header avatar size) those
  collapse to grey mush.
- Avoid fills (except `.keyfill` on keyboard panels). The duotone field
  behind the figure is the colour signal; the figure is line.
- Avoid micro-detail below ~2 SVG units. At 32px tile size (the smallest
  render), 1 SVG unit ≈ 0.32 device pixels — anything finer disappears.
- Don't over-detail at the other end either. At 250px (home hero) the
  figure shouldn't read as sparse or empty.

## Stroke-width range to test against

The runtime sets `stroke-width` from `2.0` to `4.5` depending on render
context. Eyeball each redraw at both ends before signing off:

| Context | Tile size | `.ln` stroke-width |
|---|---|---|
| Home card (large) | ~220px | 2.2 |
| Hero tile / desktop hero | ~180–250px | 2.0 |
| Era strip | 140px | 2.6 |
| Mosaic regular | ~80–124px | 3.0 |
| Desk-rail ident | 80px | 3.5 |
| Mosaic ident / conn-row | 64px | 4.0 |
| Autosuggest row | 44px | 4.5 |

If a stroke at width 4.5 swallows an internal detail, the detail isn't
load-bearing — remove it or restate it at larger scale.

## The 14 figures — one-line briefs

The pose intent for each figure, so the redraw stays recognizable. Geometry
beyond this is the artist's call within the contract above.

| Key | Brief |
|---|---|
| `piano` | Pianist seated profile (head/torso to the left), both arms reaching forward (right) to a horizontal keyboard. Keyboard rendered as two parallel lines with `.keyfill` rectangles for black keys. |
| `trumpet` | Standing, head tilted back, trumpet extending forward and up-and-right. Bell flare ends at the top-right; valve buttons (3) on the body as `.dot`. |
| `trombone` | Standing facing right; slide extends horizontally forward across the right of the figure; bell folded back behind the player's shoulder on the left. |
| `sax` | Standing, sax body J-curves from mouth down across the torso and up to a bell flaring to the right at hip height. Key dots (`.dot`) running down the body. |
| `clarinet` | Standing, clarinet held vertically from mouth to bell at navel level. Both hands stacked on the instrument. Key dots running down. |
| `flute` | Standing, flute held horizontally across the face (mouthpiece at left, body extending right). Key dots running along the body. |
| `bass` | Player standing tall on the left; large rounded upright bass to the right with scroll + tuning pegs at top, body curve, f-holes, bridge, four strings (some at reduced `opacity`). Player's arms wrap around the neck and reach for the bridge. |
| `violin` | Standing, head tilted toward shoulder; violin body angled across the chest with scroll to the right; bow horizontal across the strings. |
| `guitar` | Seated 3/4 view. Guitar body diagonal across the lap, neck extending up-right with headstock + tuners at top. Fretting hand high on the neck, strumming hand near the sound hole. |
| `drums` | Drummer seated facing the viewer, both arms raised diagonally with sticks. Snare drum in front (with lug ticks). Cymbal stand top-right, hi-hat on the left. |
| `vibes` | Standing at vibraphone. Both arms forward holding mallets pointing down at a horizontal bar of vibe bars. |
| `organ` | Like the piano figure but with **two** stacked keyboards (upper + lower manual) plus a drawbar strip on top of the console. Same pose. |
| `voice` | Vocalist standing, one arm raised holding a microphone capsule angled toward the face. |
| `rest` | Figure at rest, arms folded across the body. Small `.dot` accent for a discreet question-mark glyph above the head (signals "instrument unknown"). |

## Acceptance checklist (per redrawn figure)

- [ ] `viewBox`-correct: every coordinate inside `0 ≤ x ≤ 100`, `0 ≤ y ≤ 140`. Going slightly outside is fine for elements that should clip on purpose, but the bulk should respect the box.
- [ ] Head ellipse / outline lives near `y ≈ 18–24`; feet ticks at `y ≈ 134`.
- [ ] Only `.ln`, `.dot`, `.keyfill` classes used. No inline stroke / fill / stroke-width / style.
- [ ] Renders cleanly at stroke-width 2.0 (large), 3.0 (mid), 4.5 (smallest tile).
- [ ] Recognisable in 1–2 seconds for the named instrument.
- [ ] The pose intent above is preserved (a clarinet still reads as vertical; a sax still reads as J-curved; etc.).

## Submitting redraws back

For each figure, return one fenced ```` ```svg ```` block containing the
inner markup. Same shape as `figures-source.md`. We paste each block back
into the matching `FIG_LIB.<key>` entry; no other code changes required.

## Out of scope

- The corner monogram (`.duo3-mark-ini`) — rendered separately by the
  component, not part of the figure.
- The duotone field behind the figure — owned by `Duo3.tsx` and the
  per-name palette.
- New figure keys — adding instruments is a separate change to `figKey()`.
