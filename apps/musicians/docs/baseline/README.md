# Phase D mobile-reader visual baselines

Playwright-driven reference set for the musicians mobile reader (Phase D:
home, detail, autosuggest, sheet, waking, desktop graph integration).

Regenerate on demand (dev server on :5175):

```
npx playwright test musicians-baseline-capture --project=chromium
```

Source spec: `tests/e2e/musicians-baseline-capture.spec.ts`.

> Dir is `baseline/`, **not** `baselines/`, on purpose: the root
> `.gitignore` ignores any `baselines/` directory (review-only scratch),
> so a committed reference must live under a differently-named docs dir —
> same convention as Phase E's `apps/musicians/docs/graph-baseline/`.

## Set (24 PNGs)

`{view}-{viewport}-{theme}.png` — viewport ∈ {`m390` (390×844 mobile),
`d1280` (1280×900 desktop)}, theme ∈ {`light`, `dark`}:

- `home-*` — hero, ≥16px search, journey row, curated-12 grid
- `detail-rich-m390-*` — Miles, full density (mosaic, 16 headliners + CTA)
- `detail-rich-graph-d1280-*` — Miles desktop split-pane **with the lazy
  force-directed graph panel painted** (the desktop-with-graph baseline)
- `detail-sparse-*` — Antoine, sparse + duplicate flag, worst-case still
  a complete screen
- `autosuggest-*` — combobox + portalled listbox open ("mile")
- `sheet-*` — "More about" bottom sheet open (`#about`)
- `waking-*` — calm cold-Aura "waking up" screen + retry countdown +
  cached fallback names

## NOT an MD5-identical gate

These are a **visual reference set**, not a byte-equality gate. Animations
and the caret are frozen at capture time for re-runnable stability, but the
desktop graph is a seeded force-directed layout (Phase E) — reproducible
per focus id, not byte-identical across engines (landmine 6, same as
`graph-baseline/`).

## KNOWN: frozen-token contrast gap (visible in every baseline)

The Phase-B-frozen token layer (`apps/musicians/src/index.css`) ships
`--accent`/`--dim` values below WCAG AA on the paper/ink surfaces (e.g.
`--accent #c87f1a` on `--bg #f4f1ea` = 2.86:1). It is visible in these
baselines (warm accent text on cream) and tripped by
`tests/e2e/musicians-a11y.spec.ts` as the one documented, token-owner-
blocked exception. Phase D may not edit the frozen layer — see
`.omc/notepads/2026-05-18-musicians-v1/phase-D-learnings.md` for the full
report + recommended remediation.
