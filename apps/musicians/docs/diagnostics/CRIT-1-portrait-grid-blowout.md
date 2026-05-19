# CRIT-1 root-cause analysis — "portrait renders at 8566px"

> Diagnosis only — no fix applied. Evidence gathered read-only (prod CSS/JS bundle,
> live computed ancestor chain, repo source). Dated 2026-05-19.

## Context

On mobile the live detail page (`/musicians/<id>`, e.g. Miles `wikidata:Q93341`) renders
the identity portrait `<figure>`/`<img>` at ~8566–14624 px wide on a 390 px viewport,
destroying the layout (page tens of thousands of px tall; every card a giant band).
"Verified fine" earlier against `wrangler dev`/fixtures.

## The exact mechanism (verified on production)

A **CSS-Grid `minmax(auto,1fr)` track blowout**, *not* anything the portrait owns. The
giant image is a downstream symptom (`img.duo3-photo` `naturalWidth` is **338**, not 8566).

Verified chain (live prod, viewport 390, computed values):

1. `.mu3 .desk-detail` is `display:grid; grid-template-columns:1fr` on mobile
   (`apps/musicians/src/components/components.css:1411-1413`). `1fr` ≡
   **`minmax(auto, 1fr)`**. A track's `auto` minimum = the min/max-content contribution
   of its grid item — unless the item has `min-width:0` (or non-visible overflow).
2. The single grid item is `<main class="desk-rail">`. Computed **`min-width:auto`** (no
   `min-width:0` on `.desk-rail`). So the track's automatic minimum = `.desk-rail`'s
   content max-content size.
3. Inside `.desk-rail`, **`.rec-strip` is `display:flex; flex-wrap:nowrap` with 109
   children** — "Records they shaped" renders every record (Miles 64+; no cap, no wrap,
   no `overflow`/`min-width:0`). A nowrap flex row's max-content ≈ **14624 px**.
4. That ≈14624 px becomes `.desk-rail`'s automatic minimum ⇒ the `minmax(auto,1fr)`
   track resolves to **`grid-template-columns: 14624px`** while the grid *container*
   `.desk-detail` stays **390 px** (textbook grid blowout — nothing has
   `overflow:hidden`/`min-width:0` to stop the track).
5. Block children of the 14624 px `.desk-rail` fill 14624. `<figure class="ident-photo">`
   = 14624; `.mu3 .ident-photo .duo3 {width:100%}` (`components.css:856-859`) ≈ 14596 +
   `aspect-ratio:5/4`; `img.duo3-photo {position:absolute; inset:0; width/height:100%}`
   (`components.css:125-136`) fills it.

## The user's three hypotheses — all NEGATIVE

- **Missing/purged Tailwind class?** No — plain CSS classes in `components.css`, imported
  directly via `Shell.tsx`; ships identically dev/prod; not Tailwind `@source`-scanned.
  Present verbatim in the prod CSS bundle.
- **CSS var undefined in prod?** No — no var governs this; `--duo-lo/--duo-hi` inline.
- **Prod-vs-dev build divergence?** No — CSS byte-identical. The bug is **viewport- and
  data-conditional**: fires only when (a) viewport <1024 px (mobile `1fr` track; desktop
  uses fixed `480px` at `components.css:1432-1434` → immune, measured 451 px) AND (b)
  the musician has enough records for `.rec-strip`'s nowrap max-content to exceed the
  viewport. Earlier verifications ran at desktop viewport and/or low-record fixtures, so
  never hit it. Home immune (bounded `.home-card` grid cells, no giant nowrap child).

## CRIT-1 ↔ "records dumped" share one root

`.rec-strip` rendering all 109 record nodes nowrap is itself the "records dumped" bug.
Same defect class: cap/scroll/wrap the strip removes the driver; `min-width:0` on
`.desk-rail` removes the amplifier.

## Critical files / lines

- `apps/musicians/src/components/components.css` — `:1411-1414` mobile `1fr` track;
  `:1432-1436` desktop `480px 1fr` (immune path); `.desk-rail` lacks `min-width:0`
  (amplifier); `.rec-strip` `display:flex;flex-wrap:nowrap` uncapped (driver);
  `:853-859` `.ident-photo`/`.ident-photo .duo3 {width:100%;aspect-ratio:5/4}` (no cap);
  `:125-136` `.duo3.has-photo .duo3-photo` absolute (symptom carrier).
- `apps/musicians/src/components/Duo3.tsx` — img absolute (victim, not driver).
- `apps/musicians/src/features/detail/DetailView.tsx:129-186` — grid + uncapped rail.
- `apps/musicians/src/components/RecordsStrip.tsx` — the uncapped nowrap render.

## CONFIRMED — controlled experiment (live prod, 390 px, 2026-05-19)

| Musician | `.rec-strip` children | container | computed `grid-template-columns` | portrait |
|---|---|---|---|---|
| Miles Davis (64 recs) | 109 | 390 px | **14624 px** (blowout) | 14596 px — `naturalWidth` 338 |
| Antoine Hervé (~2 recs) | 3 | 390 px | **420 px** (no blowout) | none (sparse), figure 392 px — normal |

Only record count varied; blown track = `.rec-strip` `scrollWidth` exactly (14624);
independent of the image. Causal variable isolated to nowrap `.rec-strip` max-content via
`.desk-rail` `min-width:auto` + the mobile `minmax(auto,1fr)` track. Empirically verified.

## Direction a fix would take (not executed)

(1) `min-width:0` on `.desk-rail` (canonical `minmax(auto,1fr)` cure); (2) make
`.rec-strip` a contained strip (cap items + `overflow-x:auto` or wrap) per the design.
Both together also resolve the records-dump finding. `max-width:100%` on
`.ident-photo`/`.duo3` is belt-and-suspenders, not the root cure. Belongs in the joint
CRIT/HIGH fix plan.
