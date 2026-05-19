# CRIT-2 root-cause analysis — "desktop has no graph / no 2-column layout"

> Diagnosis only — no fix. Evidence read-only (prod CSS/JS bundle + live runtime probe
> at viewport 1280). Dated 2026-05-19.

## Correction of record (important)

The original audit's "CRIT-2 = desktop has NO graph and NO 2-column layout" is **FALSE —
not reproduced**. Artifact of the earlier audit probe: (1) it waited ~3.5 s but the
desktop graph is a `React.lazy` chunk (`graph-*.js` + d3-force) running a 417-node
simulation — not mounted yet, so it saw an 11×11 stub; (2) it read
`getComputedStyle(document.querySelector('main'))` = `.desk-rail` (a block), not
`.desk-detail` (the grid) — hence false "display:block, cols:none". A separate Explore
agent's "integration code stripped from bundle" was also wrong (minified-identifier grep
artifact; it even quoted the shipped lazy-import line). Runtime verification corrected both.

## What actually happens on prod desktop (viewport 1280, verified live)

- `window.matchMedia('(min-width: 1024px)').matches` → **true**.
- `.mu3 .desk-detail` → `display:grid`, computed **`grid-template-columns: 480px 800px`**,
  width 1280, **2 children: `<main class="desk-rail">` (480 px) + `<aside
  class="desk-graph">` (800 px)**.
- Lazy chunk `assets/graph-DyvIvi8z.js` **was fetched**; the aside has a mounted
  **GraphView SVG with ~1250 `<circle>`s**, "GRAPH VIEW · MILES DAVIS" bar, zoom
  controls, node labels. Not loading-stuck.

So: 2-column layout works, graph chunk ships+loads, GraphView renders. **Neither a build
issue, nor present-but-not-rendered, nor a missing/suppressed CSS rule.**

## The real CRIT-2 defect: the graph panel is vertically unbounded (800 × 2926 px)

`aside.desk-graph` measured **800 × 2926 px**. Verified CSS chain:

1. `.mu3 .desk-detail { grid-template-columns:480px 1fr }` @≥1024
   (`components.css:1432-1435`). One implicit grid **row**; height = tallest grid item's
   content; items default `align-self:stretch`.
2. Column 1 `.desk-rail` holds the whole mobile composition incl. the uncapped nowrap
   64-record `.rec-strip` → content height ≈ **2926 px** (same uncapped root as CRIT-1).
3. The row resolves to ≈2926 px. Column 2 `aside.desk-graph`
   (`components.css:1417-1431`: `min-height:480px; display:flex; overflow:hidden` —
   **no `height`/`max-height`, no `position:sticky`, no `100vh`**) stretches to 2926 px.
4. `.mu-graph { height:100% }` then `.mu-graph-svg { position:absolute; inset:0;
   width/height:100% }` (`graphView.css.ts:8-12,59`) → SVG fills 800 × 2926.

The graph isn't intrinsically huge — it's stretched to the runaway rail-column height
because nothing binds the panel to the viewport. Spec wants a pinned ~viewport-height
"permanent side panel"; result is an 800×~2926 strip, empty/illegible above the fold —
why the on-device check read it as "no graph".

## Answers to the three CRIT-2 questions

- **Where does it break?** Not structurally — grid + graph render. The defect is the
  **panel height**: `.desk-graph` has no viewport-bounded/`sticky` height → stretches to
  the grid-row height = `.desk-rail`'s ≈2926 px content.
- **Build (absent) vs integration (not rendered)?** **Neither** — chunk fetched (HTTP
  200) + GraphView mounted (1250 circles). "Stripped from bundle" was a grep error.
- **2-col CSS missing or suppressed?** **Neither** — `@media (min-width:1024px)`
  `{grid-template-columns:480px 1fr}` is in prod CSS verbatim (minifier writes
  `width>=1024px`, equivalent) and computes `480px 800px`. Nothing suppresses it.

## CRIT-1 ↔ CRIT-2 ↔ "records dumped" — one shared root

All three trace to **`.desk-rail` content uncapped / not scroll-contained** (nowrap
all-records `.rec-strip` the worst offender) + grid items lacking `min-width:0` / a
bounded height. CRIT-1: rail max-content blows the mobile `minmax(auto,1fr)` track.
CRIT-2: rail content height stretches the desktop grid row. "records dumped": the strip
itself. Containing the rail's content (esp. records) + binding the desktop graph panel
to the viewport (`sticky`/`100vh`, independent rail scroll) addresses the family.

## Critical files / lines

- `apps/musicians/src/components/components.css:1411-1446` — `.desk-detail` grid,
  `.desk-graph` (no bounded/sticky height), the `@media (min-width:1024px)` block.
- `apps/musicians/src/features/graph/graphView.css.ts:8-12,59` — `.mu-graph`/
  `.mu-graph-svg` `height:100%` (track the container; fix the container).
- `apps/musicians/src/features/detail/DetailView.tsx:129-186` — grid; `.desk-rail`
  (col 1, uncapped); `<aside class="desk-graph">` (col 2); `useIsDesktop()` (works);
  `GraphPanelSlot` lazy (works).
- `apps/musicians/src/components/RecordsStrip.tsx` — uncapped nowrap strip (shared root).
- `apps/musicians/src/hooks/useIsDesktop.ts` — `matchMedia('(min-width: 1024px)')`,
  verified true at 1280 (NOT the cause).

## Verify (read-only)

Load `/musicians/wikidata%3AQ93341` at ≥1024 and **wait ≥5 s** (lazy d3-force + 417-node
sim). `.mu3 .desk-detail` → `grid-template-columns: 480px <N>px`, 2 children;
`aside.desk-graph` height ≈ `.desk-rail` content (≈2926), SVG 800×~2926, ~1250 circles,
`graph-*.js` in `performance` resources. Short wait or querying `<main>` reproduces the
original false reading.
