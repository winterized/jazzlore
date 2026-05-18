# GraphView seeded visual baseline (Phase E)

`miles-dark.png` · `miles-light.png` — the desktop force-directed
collaboration graph (`src/features/graph/GraphView.tsx`) rendered in
isolation with the **Miles-like fixture** (1 focus + 56 collaborators, the
design's "abundance" stress case), in both themes.

> Dir is `graph-baseline/`, **not** `baselines/`, on purpose: the root
> `.gitignore` ignores any `baselines/` directory (review-only scratch),
> so a committed reference must live under a differently-named docs dir —
> same convention as `packages/ui/docs/design_handoff_sticky_header/`.

## NOT an MD5-identical gate (landmine 6)

The repo's standard visual gate is MD5-byte-equality. **That gate does not
apply here.** A force-directed layout is non-deterministic *unless seeded*;
this feature makes it reproducible by seeding everything off
`hash(focusId)` (`src/features/graph/seed.ts`) and settling synchronously
(`src/features/graph/layout.ts`). The layout is therefore stable for a fixed
focus id — verified in a real browser: reloading the harness yields
byte-identical node transforms.

These PNGs are a **seed-pinned reference**, compared with **tolerance**
(visual diff / structural review), never byte-equality:

- Anti-aliasing, sub-pixel text metrics and font hinting differ per
  machine/engine even with an identical layout.
- The *layout math* is deterministic; the *rasterisation* is not.

So: treat a pixel diff here as "review the change", not "fail the build".
The deterministic part (node/edge positions for a given seed) is asserted
**numerically** in `src/features/graph/layout.test.ts` — that is the real
regression gate; these images are the human-facing aesthetic reference.

## How to regenerate

A throwaway harness lives at `src/features/graph/harness/` (not shipped,
not routed — App.tsx/pages are Phase D's surface):

```
pnpm -F @jazzlore/musicians exec vite --port 5176 --strictPort
# then, via Playwright at 1280×760:
#   http://localhost:5176/src/features/graph/harness/harness.html?theme=dark
#   http://localhost:5176/src/features/graph/harness/harness.html?theme=light
```

Reduced-motion is irrelevant to the capture: the harness mounts the cold
(settled) layout, so there is no in-flight re-centre tween to stabilise.

## What to look for

- Amber focus node dead-centre (`--accent`), ring halo.
- Peripheral nodes: deterministic duotone per id, **radius ∝ record count**.
- Edges: **stroke-width ∝ collaboration weight**; strong (≥7) edges amber.
- Every node carries a name + instrument label + initials (color is never
  the sole signal — a11y).
- Dark/light parity driven entirely by the frozen `--*` token vars via
  `data-theme` (no palette is hard-coded in the feature).
