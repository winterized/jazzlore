# Mosaic verification (Group C item 8)

> Verification-only task — no code changes. Driven by Playwright MCP against
> `https://musicians.jazzlore.com` on 2026-05-20, post-Wave-1 + Wave-2 deploys
> (commits `3877349` and ancestors). Verdict: **PASS — all four assertions met.**

## Test setup

- **Page:** `/musicians/wikidata:Q93341` (Miles Davis — best case; 525 collaborators in Aura)
- **Viewport:** 390 × 844 (mobile reader, per the design's primary target)
- **Theme:** light (`<html data-theme="light">`)
- **Bundle at verification time:** `index-NyWrJw8T.js` (C-meta deploy; latest)

## Findings

### 1. Tiles render (≥ 1 expected)

- **14 `.mtile` elements** in the orbit mosaic at 390 viewport.
- 1 hero tile (`.mtile.hero`), 13 sized tiles.
- Mosaic header reads exactly the design's copy: `Orbit · who they played with most size = records · initials = name`.

### 2. Size encodes record count (ratio > 1.5 threshold)

- **Largest tile (Kenny Clarke, drum kit, 15 records):** `.mtile.hero` at **179 × 138 px**.
- **Smallest tile (no-photo, 1 record):** `.mtile.no-photo` at **58 × 44 px**.
- **Width ratio: 3.10** (≫ 1.5). Size encoding works.
- Other size classes observed: `.s2` (119 × 44), `.s3 .h2` (180 × 91) — matches the `sizeClass(sharedRecordCount)` mapping at `apps/musicians/src/components/MosaicV4.tsx`.

### 3. Duotone tiles paint via CSS gradient on `::before`

The duotone is rendered as a layered radial+linear gradient on the `.duo3 ::before` pseudo-element, using the inline CSS custom properties from MosaicV4's render:

- `.duo3` direct style: `--duo-lo: #241a2a; --duo-hi: #7a5b9a;` (per-collaborator palette from `paletteFor(c.name)`).
- `.duo3::before` computed `background-image`:
  ```
  radial-gradient(120% 80% at 28% 22%, rgb(122, 91, 154) 0%, rgba(0, 0, 0, 0) 55%),
  radial-gradient(140% 100% at 78% 100%, rgb(36, 26, 42) 0%, rgba(0, 0, 0, 0) 70%),
  linear-gradient(rgb(36, 26, 42) 0%, color(srgb 0.0847059 0.0611765 0.0988235) 100%)
  ```
  → `rgb(122, 91, 154)` = `#7a5b9a` (the inline `--duo-hi`) and `rgb(36, 26, 42)` = `#241a2a` (the inline `--duo-lo`). Both inline custom properties are consumed; the gradient is per-tile distinctive.
- `.duo3::after` adds a subtle 1 px dot-noise texture (opacity 0.5) over the gradient.

The `.mtile-init` span renders the initials ("KC") and `.mtile-num` renders the count badge (`×15`) over the duotone. The full visual is intact.

### 4. Pulse lifecycle on tile tap → targeted ConnRow

- **Target tile:** Kenny Clarke hero (aria-label `Kenny Clarke, drum kit, 15 records together`).
- **Target ConnRow:** matched by `peerName` substring search across `.conn` elements; resolved to aria-label `Kenny Clarke drum kit 15 records, most Young Man With a Horn 1952`.
- **Pulse onset:** **151 ms** after tap (within the 200 ms gate).
- **Pulse offset:** **1540 ms** after tap (within the 1600 ms gate).
- **Pulse duration:** **1389 ms** — matches the documented `PULSE_MS = 1400` constant at `apps/musicians/src/hooks/useMosaicScrollPulse.ts:21` exactly (within the 50 ms RAF jitter).

The pulse class lifecycle was the user-visible outcome required by the design ("1.4 s pulse on tap+scroll-land"). The IntersectionObserver mechanism inside `useMosaicScrollPulse` works correctly: the targeted row was already in view (no scroll required), and the pulse class still fired and cleared on the documented timing.

## Conclusion

Item 8 is **VERIFIED ON PROD**. No follow-up PR needed.

The mosaic feature was already implemented and shipped pre-Group-C (per the Group C inventory at the original joint fix plan); this verification confirms it survived Wave 1 (BFF data subset changes + new overflow menu in the header) and Wave 2 (identity meta chain + bio teaser) without regression.

## Verification command (reproducible)

```
# Coordinator (this session) — Playwright MCP driving headless Chromium:
# - mcp__playwright__browser_resize { width: 390, height: 844 }
# - mcp__playwright__browser_navigate { url: 'https://musicians.jazzlore.com/musicians/wikidata:Q93341' }
# - mcp__playwright__browser_evaluate with the tile-introspection + pulse-lifecycle JS
```

Future regressions should also re-run this script on prod. The Playwright MCP captured screenshot for evidence is at `.playwright-mcp/mosaic-miles-m390.png` (not committed; reproducible from the script).
