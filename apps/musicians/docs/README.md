# Jazzlore Musicians — Handoff README

`musicians.jazzlore.com` · third site in the Jazzlore portfolio.

A mobile-first, tap-driven jazz-musician navigator built on a Neo4j graph of
musicians, records, and the "played-on" relationships between them. The user's
win condition is two or three new musicians or records they want to listen to
on Spotify or Apple Music — everything else is in service of that.

---

## Composition (locked)

| Surface | Anatomy |
|---|---|
| **Detail page** | header → identity strip → 1-line bio + listen → image-only mosaic → ranked rail (16 fat headliners) → "Show all N →" expansion CTA → "From the same era" → records. |
| **Home page** | hero invitation · visible search bar · "Start a journey" row (random / era / label) · curated 12 with hooks. |
| **Desktop detail** | rail spine left (480 px), force-directed graph as a permanent side panel right. Click a node to re-centre. |

The composition is the same at sparse, common, and abundance data densities.
It was stress-tested against Antoine Hervé (~2 collaborators, no bio, possible
duplicate), Bobby Timmons (~14 collaborators, rich data) and Miles Davis (56
collaborators surfaced of ~100).

---

## Two pass-5 reversals

### 1. Rail length — "Show all N →" expansion, not density tiering

Default state has the same predictable layout for every musician regardless
of collaborator count:

```
[ 16 fat headliners ]
[ "Show all 56 collaborators ↓"  · accent CTA with preview line ]
[ From the same era — strip ]
[ Records they shaped — strip ]
```

The CTA hosts a preview line ("47 more, including Hancock, Williams,
Henderson and 44 others") so the user knows what's behind the tap.

Expanded state loads the long tail inline as fat cards — **same treatment as
headliners**, no density downgrade — with an italic `tail-marker` dividing
headliners from "the rest."

**Why:** long-tail discovery is opt-in, not opt-out. Casual users browse the
headliners and choose to dive deeper or take a divergence path. Power users
tap "Show all" and get completionism. Both first-class.

### 2. Graph — force-directed, not deterministic radial

Reverts to the hand-placed `GraphView`. "Alive" matters more than structural
predictability for a jazz-network visualization.

**Production approach:** seed the force-directed simulation from
`hash(canonical_id)` for cold-start reproducibility, but **don't freeze
positions** — let the solver settle. Annotate re-centre with brief easing
(≤ 1 s) so motion reads as life, not stutter.

---

## Connection card · anatomy (same everywhere)

| Field | Detail |
|---|---|
| Portrait | 64 px duotone, deterministic palette per canonical id |
| Name | 16 px Geist, weight 600 |
| Instrument + relationship | 11 px Geist, muted — "Tenor sax · First Great Quintet, 1955–60" |
| Top record line | `Most: "Moanin'" '58` — most significant shared record |
| Count chip | `+6 more` — accent-soft pill, mono numerals |
| Listen | Spotify + Apple, per-card, inline |
| Hit target | Entire row tappable (88 px min). Listen buttons stop propagation. |
| Aria-label | `${name} ${inst} ${count} records, most ${topRecord} ${year}` verbatim |

---

## Mosaic · the orbit

Image-only tiles. Size encodes record count. Tap → scroll the matching rail
card into view + 240 ms accent pulse.

| Variant | Treatment |
|---|---|
| Default | Subdued top-left initials, 10–11 px Geist Mono, ~78% white, 1 px shadow. An identifier of last resort. |
| `photo:false` fallback | Duotone collapses to flat `--card` surface. Initials lift to centered + 18 px small / 28 px hero. Geist 700. Same component, graceful degradation. |
| Long-press | Direct navigation (power-user shortcut). |

---

## Image attribution (mandatory, per-image)

Every musician portrait and every album cover renders a two-line caption
directly beneath:

```
Photograph · Francis Wolff for Blue Note Records, August 1958.
Used under Wikimedia Commons (CC BY-SA 4.0). Cropped for layout.
```

Missing-photo gets an italic placeholder ("No portrait on file — Wikimedia
Commons request pending"), never silent.

---

## States designed

- **Happy path** (Bobby Timmons, Miles Davis)
- **Abundance** (Miles · 56 of ~100 collaborators)
- **Sparse data** (Antoine Hervé · no bio, no portraits, possible duplicate)
- **Autosuggest** (typing + accent-folding + popular-starts fallback)
- **"More about" expansion** (bottom sheet with drop cap)
- **Error** (Neo4j unreachable · cached fallback names · calm tone)
- **Both themes** dark + light
- **Both breakpoints** mobile (390 px) + desktop (1280 px)

---

## Motion specs

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Mosaic-tap pulse | 1.4 s | ease-out, single iteration | `rgba(244,162,51,.20)` → transparent. Triggered on the matching rail card after scroll lands. |
| Mosaic-tap scroll | 360 ms | `cubic-bezier(.22,.61,.36,1)` | `scrollIntoView({block:'center', behavior:'smooth'})`. Reduced-motion → instant. |
| "Show all" expansion | 320 ms | ease-out | Height 0 → max-content + content-fade 200 ms. Scroll position pinned to CTA's previous y. |
| Graph re-centre | 900 ms | ease-in-out | Physics solver re-settles. Edge weights re-interpolate in lockstep. |
| "More about" sheet | 280 ms | `cubic-bezier(.32,.72,0,1)` | translateY 100% → 0%; backdrop fades 200 ms. Dismiss on backdrop tap, ↓ swipe (≥ 80 px), × press. |
| Autosuggest | 80 ms debounce | — | Render hits with 60 ms stagger (max 6). Match-highlight `<em>` never re-mounted. |
| Reduced motion | 0 ms | — | All animations clamp; pulse single-frame; scroll instant; graph snaps. |

---

## Design tokens

### Dark
- **Surfaces** `--bg #0a0a0a · --bg-soft #0d0d0d · --paper #161616 · --card #181818 · --card-hover #1d1d1d`
- **Text** `--text #f4eede · --text-soft #d9d2c1 · --muted #8a8378 · --dim #565047`
- **Lines** `--line #242322 · --line-soft #1c1c1b`

### Light
- **Surfaces** `--bg #f4f1ea · --bg-soft #f8f5ee · --paper #ffffff · --card #ffffff · --card-hover #faf7f0`
- **Text** `--text #1a1612 · --text-soft #3a342c · --muted #6a6258 · --dim #9b9384`
- **Lines** `--line #e2ddd0 · --line-soft #ede8dc`

### Accent
- `--accent #f4a233` (dark) / `#c87f1a` (light)
- `--accent-soft rgba(244,162,51,.14–.16)`

### Typography
- `Geist 400/500/600/700` — UI body and headings
- `Geist Mono 400/500/600` — metadata, labels, timestamps
- `Newsreader 400/500/600 + italic` — editorial bio voice, invitational headlines
- Body 13–16 px; italics for editorial voice; mono for metadata.

### Radii
- `3–4 px` album thumbs
- `4–6 px` tiles
- `6–8 px` cards
- `14 px` bottom sheet

---

## Accessibility

- **Color-not-sole-signal.** Mosaic tiles always carry initials. Connection cards always carry instrument + relationship text. Graph nodes carry name + instrument labels.
- **Hit targets ≥ 44 px.** Connection rows 88 px; mosaic tile minimum 44 × 44; expansion CTA 48 px.
- **Aria-labels on every tappable** — name / count / relationship verbatim regardless of what's visible.
- **Focus order matches reading order.** Header → identity → bio → listen → mosaic → rail → CTA → era → records. Bottom-sheet traps focus while open.
- **Contrast.** Body text ≥ 4.5:1 in both themes. Muted family reserved for non-essential metadata.
- **Reduced motion.** All scroll, pulse, expansion, sheet, graph, and stagger animations honour `prefers-reduced-motion: reduce`.

---

## Implementation gotchas

- **Mosaic-to-rail mapping.** Tap → `scrollIntoView({block:'center'})` on the matching `ConnRow` by `data-collab-id`. Apply the pulse class on scroll-land, not on tap, or the highlight clips under the sticky header.
- **Bottom sheet portal-out.** Render at the app-shell root, not inside the scrolled detail panel — same lesson the sticky-header pattern taught us.
- **Expansion CTA hidden in expanded state.** Don't replace with "Show less" at the top (user's already scrolled past). If you want collapse, put it after the tail.
- **Graph determinism via seeds, not positions.** Seed the simulation from `hash(canonical_id)` for cold-start reproducibility, but DON'T freeze positions. Let the solver settle.
- **Autosuggest accent-folding.** Use `name.normalize('NFD').replace(/\p{Diacritic}/gu, '')` for the fold, but render the original name. `<em>` match-highlight uses offsets from the original string, not the folded one.
- **Photo:false flag is data, not derived.** Set from presence of `image_url` in the graph. Don't try to guess from name.
- **Long tail count is data-driven.** Bobby has ~14 collaborators total — his rail never shows the expansion CTA. Render the CTA only when `total > 16`.

---

## What's in this package

```
handoff/
├── README.md                                  ← this file
├── jazzlore-musicians-final.html              ← single-file shareable design (open in any browser)
└── source/
    ├── Jazzlore Musicians exploration v5.html ← entry point
    ├── design-canvas.jsx                       ← canvas wrapper (shared starter)
    └── app/
        ├── musicians-data.js                   ← pass-1 data (duotone helpers)
        ├── musicians2-data.js                  ← pass-2 enriched
        ├── musicians3-data.js                  ← pass-3 converged
        ├── musicians4-data.js                  ← pass-4 long-tail + photo flags
        ├── musicians3-styles.css               ← base styles (tokens, components)
        ├── musicians4-styles.css               ← pass-4 additions
        ├── musicians5-styles.css               ← pass-5 expansion CTA + tail marker
        ├── musicians3-shared.jsx               ← Duo3, MosaicHeader, ConnRow, EraStrip, RecordsStrip
        ├── musicians3-mobile.jsx               ← mobile home, autosuggest, "More about"
        ├── musicians3-desktop.jsx              ← desktop home, GraphView (force-directed)
        ├── musicians4-components.jsx           ← MosaicV4, AttribPhoto/Album, ErrorState
        ├── musicians5-components.jsx           ← MobileDetailV5, DesktopDetailV5 (final)
        ├── musicians5-readme.jsx               ← README rendered as a card on the canvas
        └── musicians5-app.jsx                  ← canvas root
```

These are **design references in HTML** — prototypes showing the intended
look and behaviour. Not production code to ship as-is. Recreate in the
Jazzlore codebase using its existing component library; if it has a shared
package across chords and scales, the new components should live there too.

---

Built across five passes — exploration → reweighting → convergence →
additions → reversals & lock.
