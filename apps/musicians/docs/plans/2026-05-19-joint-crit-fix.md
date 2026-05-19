# Musicians v1 — Joint fix plan (CRIT-1 + CRIT-2 + records-dump, Era data wiring, polish)

> Plan only. **No code touched.** On approval this file is persisted to
> `apps/musicians/docs/plans/2026-05-19-joint-crit-fix.md`; this scratch file is
> transient.

## Context

`apps/musicians` v1 shipped to `musicians.jazzlore.com` but the on-device check
revealed substantial deviation from the pass-5 design. Three RCAs in
`apps/musicians/docs/diagnostics/` established the failure shape:

- **CRIT-1, CRIT-2, and "records dumped"** share one structural root —
  `.desk-rail` content uncapped (worst offender: `.rec-strip` with all 64+
  records) + grid items lacking `min-width:0` / a bounded height. On mobile this
  blows `minmax(auto,1fr)` to 14624 px (giant portrait); on desktop it stretches
  the graph panel to 800 × ~2926 px (graph invisible above the fold).
- **"From the same era"** is a data-wiring gap, not a CSS or build defect. The
  component is shipped, mounted, and correctly self-hides on empty; the BFF
  never supplies `sameEra`.
- Seven polish items (bio teaser, identity meta chain, home subtitles, ConnRow
  context, tab title, header overflow, mosaic verification) are independent of
  both root causes — they're each their own surface fix or verification.

The fix is grouped by **defect shape**, not by file, so each group runs as a
self-contained PR with predicates we can actually assert. Groups A and B run in
parallel because their file sets are provably disjoint (evidence table below).
Group C is deferred until A and B are merged so polish work happens against the
corrected baseline.

The previous per-phase "verified ✅" claims were measured against `wrangler dev`
+ desktop viewport + low-record fixtures — none of which reproduces the bug.
This plan's acceptance gate is **production or preview URL, multiple viewports,
both musician profiles, predicate-based computed-style assertions** — not
MD5-identical baselines (the layout is intentionally changing, so byte-identical
is the wrong bar here).

---

## Groups and ownership boundaries

### Group A — Structural defect (one coordinated PR)

Bind `.desk-rail` content (the grid item) and bind `.desk-graph` to the viewport
(the panel). Internal phases are sequential because A2's correctness depends on
A1 being in place (A2's viewport-bind is only verifiable once the rail row
height is no longer the runaway driver).

**Files Group A modifies:**

| File | What changes |
|---|---|
| `apps/musicians/src/components/components.css` | `.desk-rail` gains `min-width:0` (canonical `minmax(auto,1fr)` cure). `.rec-strip` hardened (`min-width:0`, retained `overflow-x:auto`, optional `scroll-snap`). `.desk-graph` bound to viewport via `position:sticky; top:0; align-self:start; height:100dvh` (rationale below). |
| `apps/musicians/src/components/RecordsStrip.tsx` | Optional cap (e.g. render first N + a "more" affordance) IF Phase A1's CSS-only fix doesn't bring `scrollWidth` and visual density down to spec. Decision happens at A1's verification gate; if CSS alone passes, this file is untouched. |

**Files Group A does NOT touch:**
- `DetailView.tsx` — Phase 1 exploration confirms the JSX (grid wrapper, `.desk-rail` composition, `useIsDesktop()` gate around `<aside class="desk-graph">`) is structurally correct; all fixes are CSS-only or RecordsStrip-internal.
- `graphView.css.ts` — already correct (`.mu-graph { height:100% }`, `.mu-graph-svg { inset:0 }`); it tracks its container; we fix the container.

**Graph-viewport binding choice: `position:sticky; top:0; align-self:start; height:100dvh`.**

Why this and not the alternatives:
- **`align-self:start`** is required so the grid item is sized by its own height (100dvh), not stretched to the row height (the current failure). Without it, sticky inside a stretched item produces a panel taller than the viewport.
- **`100dvh`** (dynamic viewport height) handles iOS Safari's collapsing URL bar correctly; we keep `100vh` as fallback via `height: 100vh; height: 100dvh`. The site already targets iOS audio, so this matches the platform discipline.
- **`position:sticky; top:0`** delivers the spec's "permanent side panel" UX — the panel pins as the user scrolls the rail. The rail scrolls independently in its column without an explicit `overflow:auto` because column 1 simply has tall content.
- **Why not `position:fixed`?** Fixed leaves a column-shaped gap in the grid; sticky lives inside the grid track and works with the existing layout.
- **Why not just `height:100dvh` (no sticky)?** Without sticky, the panel scrolls off-screen as the rail scrolls — defeats the "permanent" requirement.

### Group B — Era strip data wiring (additive feature, one PR)

Three internal phases. Order is forced by data dependencies (B1 → B2 → B3).

**Files Group B modifies:**

| File | What changes |
|---|---|
| `apps/musicians/worker/cypher.ts` | Add `peersByEra(id, limit)` builder — same Cypher style as existing builders (template string, parameterized, read-only). |
| `apps/musicians/worker/endpoints.ts` | In `handleDetail` after `deriveEra`, run the peers query, shape rows into `EraItem[]`, attach as `sameEra` sibling on the response (same pattern as the existing `{ ...detail, era }` sibling). |
| `apps/musicians/src/hooks/useMusicianData.ts` | Extend `MusicianDetailResponse` to include `sameEra?: EraItem[]`. Pass through unchanged (the hook's job is to surface, not derive). |
| `apps/musicians/src/pages/MusicianPage.tsx` | Pass `sameEra={state.data.sameEra ?? []}` to `<DetailView …>`. |

**Files Group B does NOT touch:**
- `apps/musicians/src/lib/types.ts`, `apps/musicians/src/lib/map.ts` — **frozen contract** (byte-identical since cfd3540). `sameEra` rides as a sibling to `MusicianDetail`, not inside it (matches the existing `era` sibling pattern).
- `apps/musicians/src/components/EraStrip.tsx` — already correct (shipped + mounted + self-hides on empty).
- `apps/musicians/src/features/detail/DetailView.tsx` — `sameEra?: EraItem[] = []` prop and `<EraStrip items={sameEra} …/>` are already wired (Phase 1 exploration confirmed both lines).
- Anything in Group A's set.

**Peers query shape (for implementer agent — verify against live schema with `mcp__neo4j__get_neo4j_schema` against DB `d30e12cc` before writing):**

```cypher
MATCH (m:Musician {id: $id})
WITH m,
     coalesce(m.genres, []) AS genres,
     m.years_active_start AS yas,
     m.years_active_end AS yae
MATCH (p:Musician)
WHERE p.id <> m.id
  AND any(g IN coalesce(p.genres, []) WHERE g IN genres)
  AND coalesce(p.years_active_start, 9999) <= coalesce(yae, 9999) + 10
  AND coalesce(p.years_active_end, 0)    >= coalesce(yas, 0)    - 10
  AND NOT EXISTS {
        MATCH (m)-[r]-(p)
        WHERE type(r) IN $excludedRels   // verify exact rel labels first
  }
RETURN p.id                  AS id,
       p.name                AS name,
       p.primary_instruments AS primary_instruments,
       p.picture_url         AS picture_url,
       size([g IN coalesce(p.genres, []) WHERE g IN genres]) AS overlap
ORDER BY overlap DESC, coalesce(p.years_active_start, 9999) ASC
LIMIT $limit
```

Notes:
- Exact relationship labels to exclude (the design's "contemporaries who weren't
  in their bands") are TBD — the implementer agent verifies via
  `mcp__neo4j__get_neo4j_schema` and the existing collaborator query in
  `cypher.ts`. If the schema doesn't have the rels expected, fall back to a
  simpler heuristic (genre+era overlap only) and document the deviation.
- `$limit` defaults to 12; the strip can scroll. `EraStrip` self-hides if 0
  results, so an empty result is a valid outcome.
- Output rows are mapped to `EraItem` shape `{ id, name, instrument?, hint?,
  photo }` in `endpoints.ts` (not in `lib/map.ts` — frozen). `photo` is a
  presence boolean derived from `picture_url`.

### Group C — Composition + polish (deferred; sub-planned after A+B merge)

Listed for scope only. C is **not** planned in detail in this artifact — polish
items may shift once the corrected layout reveals what actually needs work.

| Item | Touch (preliminary) | Defer reason |
|---|---|---|
| Identity meta chain (cap instrument, multi-genre) | `DetailIdentity.tsx`, `worker/era.ts`, `worker/endpoints.ts` (expose `genres` chain) | Needs `era.ts` rework; touches BFF — wait until B's BFF changes have landed. |
| Bio teaser + sheet dedup | `DetailIdentity.tsx`, `MoreAboutSheet.tsx`, `worker/endpoints.ts` (optional `bioFull`) | Looks different once layout isn't broken; teaser length depends on rail width. |
| Home subtitles correctness | `worker/endpoints.ts`, possibly curated-list source | Data-quality bug (Mingus primary instrument ordering) — needs Aura curation, separate from layout. |
| ConnRow relationship/context | `ConnRow.tsx`, `worker/endpoints.ts` (populate `relationship`) | Optional BFF derivation — defer to after the layout calms. |
| Tab title client update | `MusicianPage.tsx`, `HomeView.tsx` (`useEffect(document.title = …)`) | Trivial; bundle with the polish sweep. |
| Header "···" overflow | `Shell.tsx` / `HomeView.tsx` / `DetailView.tsx` headers, new `OverflowMenu` component | UX polish; not blocking. |
| Mosaic verification | (verification only) | Already implemented (duotone Duo3, size encoding, 1.4 s pulse on scroll-land via IntersectionObserver) — just verify on prod. |
| **Era peers — NULL years_active handling** | `worker/era.ts`, `worker/cypher.ts` `peersByEraCypher` | **Surfaced 2026-05-20 post-merge.** Antoine has NULL `years_active_start/end`; the year-window filter falls open, so any genre overlap qualifies. Result: Antoine paired with Benny Goodman / Lionel Hampton / Sinatra (big-band era — not Antoine's actual contemporaries). Two-pronged fix: (a) `deriveEra` more accurate (Antoine is post-bop / contemporary, not "Swing"); (b) peers query falls back to `birth_year ± N` when `years_active_*` is NULL, OR returns `sameEra: []` so EraStrip self-hides for sparse musicians (the original B3 assumption). Tracking note added to the live spec at `tests/e2e/musicians-joint-fix-acceptance.spec.ts` Phase B3 docstring. |

---

## File-ownership table (the explicit non-overlap claim, with evidence)

| File | Group A | Group B | Group C | Conflict |
|---|:---:|:---:|:---:|---|
| `apps/musicians/src/components/components.css` | ✏️ | — | maybe | none in A↔B |
| `apps/musicians/src/components/RecordsStrip.tsx` | maybe | — | — | none |
| `apps/musicians/src/features/graph/graphView.css.ts` | (verify only) | — | — | none |
| `apps/musicians/src/features/detail/DetailView.tsx` | — (Agent A: no JSX changes) | — (already wired) | maybe (bio teaser JSX) | none in A↔B |
| `apps/musicians/worker/cypher.ts` | — | ✏️ | — | none |
| `apps/musicians/worker/endpoints.ts` | — | ✏️ | maybe (later) | none in A↔B |
| `apps/musicians/worker/era.ts` | — | — | ✏️ (later) | none |
| `apps/musicians/src/hooks/useMusicianData.ts` | — | ✏️ | — | none |
| `apps/musicians/src/pages/MusicianPage.tsx` | — | ✏️ | maybe (`document.title`) | none in A↔B |
| `apps/musicians/src/components/EraStrip.tsx` | — | — (already correct) | — | none |
| `apps/musicians/src/components/DetailIdentity.tsx` | — | — | ✏️ (later) | none |
| `apps/musicians/src/components/ConnRow.tsx` | — | — | ✏️ (later) | none |
| `apps/musicians/src/components/MoreAboutSheet.tsx` | — | — | ✏️ (later) | none |
| `apps/musicians/src/features/home/HomeView.tsx` | — | — | maybe (header) | none |
| `apps/musicians/src/lib/types.ts` | — (frozen) | — (frozen) | — (frozen) | — |
| `apps/musicians/src/lib/map.ts` | — (frozen) | — (frozen) | — (frozen) | — |

**Conclusion:** Group A and Group B file sets are provably disjoint. The
parallel-OMC stream design is safe.

**Pre-flight `comm -12` check before spawning the parallel agents — HARD GATE, no negotiation:**

Runs **after Phase 0 is merged**, **before** Stream A's or Stream B's agents are
spawned. The coordinator computes each stream's planned file-touch set from the
file-ownership table above, sorts both, and intersects.

```bash
# planned-file lists derived from the file-ownership table:
cat > /tmp/a-files <<EOF
apps/musicians/src/components/components.css
apps/musicians/src/components/RecordsStrip.tsx
EOF

cat > /tmp/b-files <<EOF
apps/musicians/worker/cypher.ts
apps/musicians/worker/endpoints.ts
apps/musicians/src/hooks/useMusicianData.ts
apps/musicians/src/pages/MusicianPage.tsx
EOF

# intersection MUST be empty:
comm -12 <(sort /tmp/a-files) <(sort /tmp/b-files)
```

**If output is non-empty: the parallel-OMC plan is invalid. Fall back to
sequential — A first, then B — immediately. Do NOT renegotiate file ownership
mid-stream, do NOT carve out a "shared" file, do NOT add coordination locks. The
file-ownership table is the contract; if it doesn't hold, the contract is
broken and the parallel architecture is the wrong choice for this work.**

This same check is repeated against the **actual** diffs once each stream has
its first commit — `git diff --name-only origin/main..HEAD` on each worktree,
intersect, must remain empty. If a real diff drifts off-table, the implementer
has crossed the boundary; treat as a boundary violation (see Risk 2).

---

## OMC orchestration

```
                 ┌─────────────────────────┐
                 │  Coordinator (this thread)
                 │  - reads diagnostics + this plan
                 │  - runs Phase 0 (harness)
                 │  - runs pre-flight comm-12 check
                 │  - dispatches parallel streams
                 └────────────┬────────────┘
                              ▼
            ┌──────────────────────────────────┐
            │ PHASE 0 — Verification harness   │
            │ (coordinator-owned, blocks A+B)  │
            │   - fix Antoine ID Q2856321 →    │
            │     Q586360 in both specs        │
            │   - new joint-fix-acceptance     │
            │     spec, parameterized by       │
            │     PREVIEW_BASE                 │
            │   - parameterize a11y + lighthouse│
            │     to accept a URL override     │
            │   - one PR (#0), reviewed,       │
            │     merged before A or B begin   │
            └────────────────┬─────────────────┘
                             ▼
            ┌──────────────────────────────────┐
            │ Pre-flight comm-12 check         │
            │  (hard gate, no negotiation)     │
            │  union(A.files) ∩ union(B.files) │
            │  must be empty                   │
            │  IF NON-EMPTY → sequential       │
            └────────────────┬─────────────────┘
                             ▼
              ┌──────────────┴───────────────┐
              ▼                              ▼
   ┌──────────────────────┐         ┌──────────────────────┐
   │  Stream A worktree   │         │  Stream B worktree   │
   │  branch: fix/crit-a  │         │  branch: feat/era-b  │
   │  (from post-Phase-0  │         │  (from post-Phase-0  │
   │   main)              │         │   main)              │
   │                      │         │                      │
   │  A.impl (executor)   │         │  B.impl (executor)   │
   │    - A1 rail contain │         │    - B1 cypher+endpt │
   │    - A2 graph viewpt │         │    - B2 hook+page    │
   │                      │         │    - B3 live verify  │
   │  A.review (reviewer) │         │  B.review (reviewer) │
   │                      │         │                      │
   │  PR #A → main        │         │  PR #B → main        │
   └──────────┬───────────┘         └──────────┬───────────┘
              │                                │
              └────────────────┬───────────────┘
                               ▼
            ┌──────────────────────────────────┐
            │ Integration check (single point) │
            │  - merge A and B into             │
            │    `integration/joint-crit-fix`   │
            │  - Cloudflare deploys preview     │
            │  - full acceptance matrix runs    │
            │    against the integrated preview │
            │  - if green → merge A then B to   │
            │    main (each as their own PR)    │
            └──────────────────┬───────────────┘
                               ▼
            ┌──────────────────────────────────┐
            │ Group C planning starts          │
            │  (only after A and B are on main)│
            └──────────────────────────────────┘
```

### Phase 0 — verification harness extension (coordinator-owned, blocks A and B)

Both streams consume this harness; neither stream extends it. This avoids two
independent extensions racing each other or producing inconsistent baselines.

**Phase 0 changes (one PR, `chore/phase-0-harness`):**

| File | Change |
|---|---|
| `tests/e2e/musicians-a11y.spec.ts` | (a) Replace `wikidata:Q2856321` (404 on live) with **`wikidata:Q586360`** for Antoine Hervé — verified live 2026-05-19, 3 records. (b) Parameterize the `BASE` constant via `process.env.BASE ?? 'http://localhost:5175'` so the spec can target a preview URL. |
| `tests/e2e/musicians-baseline-capture.spec.ts` | Same Antoine ID fix; same `BASE` parameterization. |
| `tests/e2e/musicians-joint-fix-acceptance.spec.ts` | **NEW.** Parameterized by `PREVIEW_BASE`. Loops viewports `[390, 768, 1024, 1280, 1536]` × themes `[light, dark]` × musicians `[MILES=wikidata:Q93341, ANTOINE=wikidata:Q586360]`. Hosts the computed-style predicate suites that Phase A1, A2, B3 consume. Animation freeze stylesheet identical to the existing baseline spec. |
| `tests/lighthouse-audit.mjs` | Add `--url <full-url>` CLI override; default behavior unchanged. |
| `apps/musicians/docs/baseline/joint-fix/` | Create the directory (gitkeep) where Phase A/B/integration screenshots will land. |

**Phase 0 acceptance:**
- `pnpm playwright test musicians-a11y --project=chromium` green against
  localhost:5175 (unchanged behavior at default `BASE`).
- `pnpm playwright test musicians-a11y --project=chromium` green against
  `https://musicians.jazzlore.com` with `BASE=https://musicians.jazzlore.com`.
  (Existing prod is broken visually but axe should still pass — saved memory
  `reference_a11y_perf_tooling`'s canonical harness already targets this.)
- `pnpm playwright test musicians-joint-fix-acceptance --project=chromium`
  against `BASE=https://musicians.jazzlore.com` *records the broken-prod
  baseline* (the "before" the joint fix). Predicates that should currently
  FAIL on prod (e.g. mobile `grid-template-columns` ≤ container) are wrapped in
  `test.fail()` / soft assertions so Phase 0 itself stays green while
  documenting the failure modes the joint fix will resolve.
- One PR, reviewed by `code-reviewer` agent, merged to `main` before Phase 0's
  responsibility ends.

**Why coordinator-owned, not delegated to A or B:**
- Both streams' acceptance gates depend on this harness; if one stream wrote
  it, the other would block on a cross-stream dependency.
- Phase 0 is small and well-scoped; doesn't need executor judgment for code,
  but does need careful predicate design — exactly the coordinator's job.
- It also flushes out the stale-ID bug before any stream wastes time
  reproducing it.

### Stream A — agents

| Agent | Role | Owns |
|---|---|---|
| `A.impl` | OMC `executor` (model: opus for CSS judgment) | Writes the CSS changes in `components.css`. If A1's CSS gate fails, writes the RecordsStrip cap. Commits per phase. |
| `A.review` | OMC `code-reviewer` (model: opus) | Reviews A.impl's diff after each phase. Reviews ONLY Group A files; if it sees a change outside the table, flags boundary violation. |

### Stream B — agents

| Agent | Role | Owns |
|---|---|---|
| `B.impl` | OMC `executor` (model: opus for Cypher + schema verification) | Verifies live schema with `mcp__neo4j__get_neo4j_schema` first; writes the peers Cypher; attaches `sameEra` sibling; threads through hook + page. Commits per phase. |
| `B.review` | OMC `code-reviewer` (model: opus) | Reviews B.impl's diff after each phase. Reviews ONLY Group B files; flags boundary violation otherwise. |

### Coordination rules

1. **Each implementer works in its own worktree** off `origin/main` (the
   `superpowers:using-git-worktrees` skill handles isolation).
2. **Neither implementer touches the other group's files.** If A.impl thinks it
   needs `MusicianPage.tsx` (Group B's), or B.impl thinks it needs
   `components.css` (Group A's), it **stops and reports to the coordinator
   rather than crossing the boundary**. The coordinator decides: re-scope,
   sequence, or restructure.
3. **Each reviewer reviews only its own group's diff.** No cross-stream review
   until both PRs are open. This keeps reviewer context tight and avoids
   premature integration thinking.
4. **Integration check happens at exactly one point.** When both PRs are open,
   create branch `integration/joint-crit-fix`, merge both feature branches into
   it, push, let Cloudflare deploy the preview, and run the **full acceptance
   matrix** against that preview URL. If green → merge A and B independently to
   `main` (preserving the two-PR history). If red → diagnose which stream
   caused the regression on the integrated baseline; that stream's implementer
   fixes; re-integrate.
5. **Boundary violation reporting:** an implementer reporting a boundary
   violation includes (a) the file it wanted to touch, (b) the specific reason,
   (c) the proposed scope adjustment. Coordinator either authorizes the
   crossing (and lifts parallelism for that file) or restructures.

---

## Per-phase acceptance criteria

Every phase verifies against a **preview deployment URL** (Cloudflare auto-deploy on
push) or `musicians.jazzlore.com` for the final integration. **Not localhost. Not
`wrangler dev`. Not desktop-only. Not fixtures.**

Two musicians for every phase:
- **`wikidata:Q93341`** (Miles Davis) — 64 records, the bug-triggering case.
- **`wikidata:Q586360`** (Antoine Hervé) — 3 records, the bug-avoiding case.
  *(Verified live against `/api/musicians/wikidata%3AQ586360` on 2026-05-19:
  HTTP 200, 3 records, 16 collaborators, primary instrument piano, era "Swing".
  The existing test fixtures `musicians-a11y.spec.ts` and
  `musicians-baseline-capture.spec.ts` reference `wikidata:Q2856321` which 404s on
  the live DB — Phase 0 fixes this before any stream runs.)*

Five viewports for every phase: **390, 768, 1024, 1280, 1536**.
Two themes for every phase: **light, dark**.

### Phase A1 — rail containment

**Changes (predicted):**
- `.desk-rail` adds `min-width: 0`.
- `.rec-strip` adds `min-width: 0` (belt-and-suspenders; preserves `overflow-x:auto`).

**Computed-style assertions (Playwright `evaluate`):**
- At 390 px viewport, Miles: `getComputedStyle(document.querySelector('.mu3 .desk-detail')).gridTemplateColumns` ≈ container width (within 1 px). **Predicted pre-fix: 14624 px. Post-fix: ~390 px.**
- At 390 px viewport, Antoine: same assertion (regression guard — must still
  pass as it does today, ~420 px ≈ container).
- `.rec-strip.scrollWidth > .rec-strip.clientWidth` (the strip itself scrolls;
  it's not collapsed to 0).
- `document.querySelector('img.duo3-photo').getBoundingClientRect().width ≤ container × 1.05` at every viewport.
- Page total scroll height at 390 px, Miles: order of thousands, not tens of thousands (sane bound ≤ 8000 px).

**Visual deliverables:** 5 viewports × 2 themes × 2 musicians = 20 screenshots,
posted as a comment on PR #A. Stored under
`apps/musicians/docs/baseline/joint-fix-A1/` (gitignored or committed —
coordinator decides at PR time).

**a11y gate:** `pnpm playwright test musicians-a11y` 0 violations at the
preview URL (musicians-a11y.spec.ts extended to take a `BASE` env var so it
points at the preview instead of localhost:5175). Light AND dark.

**Lighthouse gate:** mobile perf ≥ 90, a11y ≥ 95 on Miles at 390 px against the
preview URL. (`lighthouse-audit.mjs` extended similarly.)

### Phase A2 — graph viewport binding

**Changes (predicted):**
- `.desk-graph` adds `position: sticky; top: 0; align-self: start; height: 100vh; height: 100dvh;` inside the `@media (min-width:1024px)` block.

**Computed-style assertions:**
- At 1280 px viewport, Miles, ≥5 s wait for lazy d3-force chunk:
  `getComputedStyle(document.querySelector('aside.desk-graph')).position === 'sticky'`.
  `.desk-graph.clientHeight ≤ viewport.height × 1.01`. **Predicted pre-fix:
  2926 px (~3.25× viewport). Post-fix: ≈ viewport height.**
- Same assertion at 1024, 1536. (At <1024 the panel is not rendered;
  `useIsDesktop()` is false.)
- Sticky behavior verified by scroll: scroll rail by 800 px, then assert
  `.desk-graph.getBoundingClientRect().top ≤ 1` (pinned to viewport top).
- Graph SVG `circle` count ≥ 100 (confirms the lazy chunk loaded and rendered,
  not stuck in stub).

**Visual deliverables:** 3 desktop viewports (1024, 1280, 1536) × 2 themes × 1
musician (Miles — graph requires data) = 6 screenshots above-the-fold; 6 more
after scrolling rail by 800 px to confirm sticky behavior.

**a11y + Lighthouse gates:** same shape as A1, but on desktop viewport.

### Phase B1 — Cypher + endpoint

**Changes (predicted):** new `peersByEra` builder in `cypher.ts`; called in
`endpoints.ts handleDetail`; result mapped to `EraItem[]` and attached as
`sameEra` sibling on the response.

**Verifications:**
- `mcp__neo4j__get_neo4j_schema` against DB `d30e12cc` confirms `:Musician`
  labels and the relationship labels Group B excludes. Schema snapshot
  attached to the PR.
- `mcp__neo4j__read_neo4j_cypher` runs the query for Miles and Antoine on the
  live DB. Miles: ≥ 5 peers expected (broad genre overlap). Antoine: 0 or low
  expected (sparse). Both outcomes valid.
- `curl -s 'https://<preview-url>/api/musicians/wikidata%3AQ93341' | jq '.sameEra | length'` → ≥ 1.
- `curl -s 'https://<preview-url>/api/musicians/wikidata%3AQ2856321' | jq 'has("sameEra")'` → `true` (key present even if array empty).
- Response shape: every item has `id`, `name`, `photo` (boolean); `instrument`
  and `hint` optional. No `era` field on items (the strip is data-agnostic).

### Phase B2 — hook + page wiring

**Changes (predicted):** `MusicianDetailResponse` in `useMusicianData.ts` gains
`sameEra?: EraItem[]`; `MusicianPage.tsx` passes `sameEra={state.data.sameEra ?? []}`.

**Verifications:**
- `pnpm -F @jazzlore/musicians typecheck` clean (no `any` introduced; the
  saved memory `feedback_verify_gate_output` applies — confirm explicit
  pass/fail, not a tail-truncated "Done").
- Smoke test: `pnpm -F @jazzlore/musicians test:run` green.
- (No live verification at this phase — B3 covers it.)

### Phase B3 — end-to-end live verification

**Changes:** none (this is verification).

**Computed-style + DOM assertions against preview URL:**
- Miles at all 5 viewports: `document.querySelector('[aria-label="From the same era"]')` exists. `.era-tile` count ≥ 5.
- Antoine: depending on B1's live result — if peers were 0, assert the section is **absent** (`null` because `EraStrip` self-hides on empty); if peers were ≥ 1, assert it's present with ≥ 1 tile.
- For a musician with confirmed peers, navigate by clicking a tile and assert
  the URL changes to that musician's detail page (`onActivate` → `goToMusician`).

**Visual deliverable:** 5 viewports × 2 themes × Miles = 10 screenshots with
the era strip visible in the rail composition (slot 4: between
`CollaboratorRail` and `RecordsStrip`, as the diagnostic and DetailView confirm).

### Integration check (single point, both PRs open)

**Trigger:** both PR #A and PR #B at "approved by their own reviewer".

**Procedure:**
1. Create branch `integration/joint-crit-fix` off `origin/main`.
2. Merge `fix/crit-a` into it; merge `feat/era-b` into it. Resolve trivially
   if anything (per the file-ownership table, expected to be empty).
3. Push. Cloudflare deploys a preview URL.
4. Run the **union** of A1, A2, B3 acceptance matrices against that preview URL.
5. Add a regression check: at 390 px Miles, the era strip slot is now between
   `CollaboratorRail` and `RecordsStrip` AND the page total scroll height is
   sane (≤ 8000 px) AND the records strip still scrolls horizontally.
6. If green: merge A → main, then B → main (independent PRs, preserves history).
7. If red: assign the regression to the responsible stream's implementer; the
   other PR holds open until re-integration is green.

---

## Risk notes (OMC parallelism)

### Risk 1: Group A's CSS lands a regression that affects Group B's verification

Both groups' acceptance matrices are independent of each other on their own
preview URLs (A's preview tests CSS metrics; B's preview tests data wiring and
DOM presence). **However**, B3's "is the era strip visible in the rail
composition?" check could be confused by a still-blown rail (the strip could be
present but rendered off-screen).

**Mitigation:** B3's preview URL is built from `feat/era-b` rebased on
`origin/main`, which by definition does **not** include A. So B3 verifies its
own correctness in the broken-layout world (era strip present in DOM, even if
the page is still ugly). The integration check is what proves B works in the
fixed-layout world.

### Risk 2: Boundary violation

If either implementer thinks it needs the other group's file, it stops. The
coordinator decides: (a) authorize the crossing (and accept that A and B are no
longer fully parallel for that file), (b) re-scope the change to avoid it, or
(c) collapse to sequential.

Reporting format:
```
Stream <A|B> boundary violation
- file: <path>
- reason: <one paragraph>
- proposed scope adjustment: <one paragraph>
```

### Risk 3: Aura schema differs from assumption

Group B's Cypher assumes `:Musician.genres: list[string]` and `years_active_start/end`.
If schema differs (e.g. genres live on a separate `:Genre` node, or
`years_active` is a single string), B1 falls back to a simpler peers heuristic
(name-based era buckets via `deriveEra`) and documents the deviation in B1's PR
body. B does NOT block A.

### Risk 4: Verification harness extension drift

The existing `musicians-baseline-capture.spec.ts` covers 2 viewports
(m390, d1280) and localhost only. The plan extends it to 5 viewports and a
parameterized `BASE` (env var). Risk: extending the spec changes captures for
existing baselines, polluting unrelated diffs.

**Mitigation:** the extension lives in a **new** file
`tests/e2e/musicians-joint-fix-acceptance.spec.ts` parameterized by
`PREVIEW_BASE` env var, leaving the existing baseline spec untouched. After
both A and B merge, decide whether to merge the new spec into the baseline
suite or keep it as a separate fixture (Group C planning will revisit).

### Risk 5: Preview URL availability

Cloudflare's auto-deploy must produce a stable preview URL per PR. If the
preview URL is flaky or absent on a specific PR, run the acceptance matrix
against `musicians.jazzlore.com` **only after merge** (user-gated per the
saved `feedback_deploy_autonomy` memory — deploy autonomy applies but
verification must still happen at a real public URL, not localhost).

---

## What would cause us to fall back to sequential execution

Trigger any one of the following → collapse to **A merged first, then B** (or
vice versa, by coordinator decision):

1. **Pre-flight file-overlap check is non-empty.** The union of files the
   implementers actually need to touch overlaps. Diagnose; if the overlap is
   structural (not a scope mistake), sequence.
2. **A's CSS fix turns out to require a JSX change** in `DetailView.tsx` or
   `MusicianPage.tsx` (e.g. CSS-only doesn't deliver the spec; the records
   strip needs a JSX cap). Since `MusicianPage.tsx` is in B's set, A waits for
   B to merge, then layers its change.
3. **B's `MusicianDetailResponse` type change reaches into a file A also
   modifies** (currently neither does, but if Group A's plan ever expands into
   `DetailView.tsx` for any reason). Sequence with B first.
4. **Integration check reveals interactions** that can't be isolated to one
   stream within one round of re-work. Re-baseline; sequence.

In every fallback case, A goes first (the structural defect is the higher
priority — Era is additive, can wait). B rebases on the merged A and re-runs
B3 against the corrected layout.

---

## Tool notes (referenced by Phase 0 / streams)

- **`mcp__playwright__browser_*`** — used ad-hoc during dev for visual
  spot-checks per the saved `feedback_playwright_mcp_during_dev` memory.
  Not a CI gate; a debugging companion.
- **`mcp__neo4j__get_neo4j_schema`** — B.impl uses this once at B1 kickoff
  to confirm `:Musician.genres` shape and the exact relationship labels.
  Note: the MCP neo4j tool in this environment is bound to database `neo4j`
  (default) and **fails against Aura's `d30e12cc`** with `DatabaseNotFound`.
  B.impl must use the BFF as the read surface (curl + the existing
  `/api/musicians/:id` shape) or configure the MCP tool's `NEO4J_DATABASE` for
  its worktree; the live BFF is sufficient for schema verification (every
  field the Cypher needs already appears in `/api/musicians/:id` payloads
  except the relationship labels, which `cypher.ts` already encodes).

---

## Plan status

- Plan-mode artifact at `~/.claude/plans/temporal-bouncing-bubble.md` (this file).
- On approval (via `ExitPlanMode`), persist to
  `apps/musicians/docs/plans/2026-05-19-joint-crit-fix.md` so the plan is the
  durable record alongside `apps/musicians/docs/diagnostics/`.
- Kickoff order is **strictly sequential through Phase 0**, then parallel:
  1. **Phase 0** — coordinator extends the verification harness, fixes the
     stale Antoine ID, parameterizes the specs, merges PR #0.
  2. **Pre-flight `comm -12` check** — hard gate; if non-empty, fall back to
     sequential A→B.
  3. **Streams A and B run in parallel** in separate worktrees, each with
     their own implementer and reviewer agent.
  4. **Integration check** — third branch, merged preview, full acceptance
     matrix; merge A then B independently.
  5. **Group C sub-planning** begins after A and B are on main.

**No code is touched by this plan.** The next action after approval is Phase 0
PR #0, not stream kickoff.
