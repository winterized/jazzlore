# Jazzlore Musicians — v1 implementation plan

> Canonical artifact: **the first execution action (Phase A) copies this file verbatim to
> `apps/musicians/docs/plans/2026-05-18-musicians-v1.md` and commits it.** (Plan mode can
> only edit this scratch file; the repo copy is created on execution.)

## Context

Third app in the Jazzlore monorepo: `apps/musicians/` → musicians.jazzlore.com. A
mobile-first jazz-discovery tool — tap through musicians to find collaborators and jump
to Spotify/Apple Music. It is the **first app with a backend** (Cloudflare Functions →
Neo4j Aura HTTP Query API). Visual/interaction source of truth = Claude Design pass 5
(`apps/musicians/docs/README.md`, `jazzlore-musicians-final.html`,
`source/app/musicians5-*`). Technical source of truth =
`apps/musicians/docs/technical-note-musicians.md`. Data source of truth =
`apps/musicians/docs/FRONTEND.md` (Neo4j schema). Execution is OMC multi-agent
(implementer → spec review → code-quality review per phase; TDD throughout; conventional
commits; user-gated merge).

## Decisions locked (resolved with user in planning)

1. **Curated home list** → hybrid: hand-picked musician IDs + hand-written "hook" lines in
   `apps/musicians/src/data/curated.ts`; BFF hydrates names/images live from Neo4j (single
   source of truth for facts, deliberate selection).
2. **Graph library** → `d3-force` simulation + hand-rolled React/SVG renderer (full
   control of editorial aesthetic, theme vars, a11y, 900ms re-centre easing).
   `react-force-graph` is the documented fallback if hand-rolling proves too costly.
3. **"More about" expansion** → bottom sheet exactly as designed **+ `#about` hash** so
   Back/Esc close it and the open state is link-addressable (no separate route/SEO surface).
4. **OG/SEO metadata** → per-request injection via the unified Worker (HTMLRewriter
   rewrites `<meta>`/OG into index.html per musician) + dynamically served `/sitemap.xml`
   from the cached search corpus. Edge-cached. **v1 accepts JS-hidden body** (OG-only is
   enough for social + snippets); verified post-deploy via Google URL Inspection;
   SSR/SSG revisited only if SEO becomes a priority.
5. **Phase 0 data audit** → Neo4j **MCP queries only** (ephemeral); produces
   `apps/musicians/docs/data-audit.md`. Consequence: the **first real Aura HTTP-client
   integration smoke moves into the BFF phase** (Phase 0 won't exercise it).
6. **Runtime** → a single **unified Cloudflare Worker** (Static Assets + `/api/*` fetch
   handler + HTMLRewriter OG injection), NOT a separate Pages-Functions project. Locked
   as a **Phase A constraint** (consistent with existing `wrangler.*.jsonc` Workers + the
   dashboard GitHub auto-deploy already wired for Workers). No `functions/` Pages dir.
7. **SEO posture (v1)** → OG/meta is per-request injected; **JS-hidden body content is
   explicitly acceptable for v1** (enough for social shares + search snippets). Verified
   post-deploy via Google URL Inspection. SSR/SSG revisited only if SEO becomes a priority.
8. **Duplicate policy** → duplicates are an **upstream data-quality issue owned by the
   populator**; the frontend renders them **faithfully — NO client-side dedup**. The BFF
   corpus/search-index loader logs a **structured warning** on suspected duplicates
   (matching external IDs across distinct node IDs) for the populator owner. The
   user-facing duplicate flag (Antoine sparse-state design) stays exactly as designed.

## Architecture

- Skeleton inherited verbatim from `apps/scales` (see Critical files). Dev port **5175**;
  package `@jazzlore/musicians`; wrangler project `jazzlore-musicians`; routes
  `/` → `/musicians` (home), `/musicians/:id`, catch-all → home.
- **Contract-first**: Phase B freezes the TS domain model + Neo4j→UI pure mappers + the
  BFF response shapes + the design-token CSS layer. Everything downstream codes to that
  frozen seam so BFF / mobile reader / desktop graph fan out **in parallel without shared
  files** (the OMC contention the technical note explicitly warns about).
- Runtime is a **single unified Cloudflare Worker** serving static assets + `/api/*` +
  HTMLRewriter OG injection (locked Phase A; `wrangler.musicians.jsonc` has a Worker
  `main` entry + assets binding, not assets-only like scales/chords).
- BFF: one page load = one BFF call; server-side aggregation; edge cache (curated 12h,
  detail 1–2h, search-index 6h, health no-store). Aura via `fetch` + HTTP Query API —
  **never `neo4j-driver`**. `AbortController` ~9s → `503 {status:"waking"}`.
- `packages/ui` reuse is limited to `ThemeToggle` + the app `useTheme()` pattern. **No
  StickyHeader.** `packages/music-core` is irrelevant here (ESLint boundary unchanged).
- Design ships its **own token system** (`--bg/--paper/--card/--accent`, fonts Geist /
  Geist Mono / Newsreader) — NOT the stone/amber tokens of scales/chords. A dedicated
  musicians token layer + self-hosted fonts is built in Phase B and frozen before fan-out.

## Phases (dependency graph + OMC parallelization)

```
A (scaffold+wiring, SOLO, blocks all)
        │
        ├──────────────┐
        ▼              ▼
B (contract: types,   Phase 0 (MCP data audit)   ── B & 0 run in parallel;
   mappers, token layer)                             0 confirms real field
        │  (contract + token layer FROZEN here)      names → reconcile into B
        ├───────────────┬───────────────┐
        ▼               ▼               ▼
C (BFF)            D (mobile reader)   E (desktop graph)   ── 3 parallel OMC lanes
        │               │               │
        └──────┬─────────┴───────────────┘
               ▼
F (Aura cron + runtime/deploy wiring; needs C)
               ▼
G (e2e + a11y + perf + visual baselines + user-gated launch)
```

Each phase: failing test → impl → green → **two-stage review (spec then code-quality)** →
**green commit**. Any phase that changes visible UI ends with a Playwright-MCP visual
baseline capture (light+dark, mobile+desktop where applicable).

### Phase A — Scaffold & wiring (SEQUENTIAL, blocks everything; solo agent)
- Copy this plan to `apps/musicians/docs/plans/2026-05-18-musicians-v1.md`; commit.
- App skeleton from `apps/scales` templates: `package.json` (`@jazzlore/musicians`),
  `vite.config.ts` (port 5175), `tsconfig.app.json`, `index.html` (title/desc),
  `src/index.css`, `src/test/setup.ts`, `src/lib/useTheme.ts`, `src/main.tsx`
  (`applyTheme(resolveInitialTheme())`), `src/App.tsx` (musicians routes).
- Root wiring: `tsconfig.json` add reference; `vitest.workspace.ts` add app;
  root `package.json` add `dev:musicians` + include musicians in `build`;
  `playwright.config.ts` add webServer (5175); create `wrangler.musicians.jsonc` for a
  **unified Worker** (name `jazzlore-musicians`, Worker `main` entry for `/api/*` +
  HTMLRewriter, assets binding → `./apps/musicians/dist`, SPA fallback).
- `apps/musicians/CLAUDE.md` — inherit scales/chords conventions (TDD, no-any, ≥16px
  inputs, dual-variant test rule, mobile-first, a11y, conventional commits) **plus**
  musicians-specific: the unified-Worker runtime constraint; stack reminders; Wikimedia
  Commons attribution requirement; Cypher conventions; **the live-Aura-smoke rule**
  (verbatim: *"Before any Phase C commit that changes Cypher or Aura-response parsing,
  run the Aura smoke against live Aura locally and record the result in the PR. Not CI,
  not every commit — a mandatory manual gate for declaring Phase C green."*);
  **placeholder for the Neo4j read-only policy** (user fills after verifying MCP).
- `apps/musicians/docs/specs/musicians.md` — spec distilled from technical note + design.
- **Acceptance**: `pnpm -F @jazzlore/musicians dev` serves a placeholder route;
  `pnpm typecheck/lint/test:run` green; `pnpm build` builds all 3 apps; commit.

### Phase B — Contract: domain types, mappers, token layer (after A; parallel with Phase 0)
- Pure, React-free, fetch-free TS in `apps/musicians/src/lib/`, fully TDD'd:
  domain types (`MusicianDetail`, `CuratedCard`, `SearchCorpusEntry`, `GraphData`,
  `Collaborator`, `RecordRef`); Neo4j-row → UI mappers (collaborator aggregation from
  shared `:PLAYED_ON`; sparse handling; `photo` from `picture_url` presence;
  **duplicates rendered faithfully — NO client-side dedup** (upstream/populator-owned));
  Spotify + Apple Music deep-link builders (search-parity); image-attribution caption
  builder; accent-fold (`NFD`/`\p{Diacritic}`) with original-offset highlight helper.
- Musicians **design-token CSS layer** + self-hosted fonts (Geist, Geist Mono,
  Newsreader) wired into `src/index.css`; `data-theme` dark/light parity.
- **Contract + token layer FROZEN at end of B** — downstream phases must not edit these.
- **Acceptance**: 100% unit coverage of mappers/builders/fold; token layer renders both
  themes; green commit.

### Phase 0 — Data audit (after A; parallel with B; Neo4j MCP only)
- Via `mcp__neo4j__get_neo4j_schema` + `read_neo4j_cypher`: sanity counts; duplicate
  heuristics (same name/aka, shared wikidata/musicbrainz/discogs id, Levenshtein≤2);
  50-musician field-coverage map (highest edge-count + curated entries).
- Output `apps/musicians/docs/data-audit.md`: coverage matrix + duplicate report
  (handed to populator owner) + **3+ worst-coverage musicians chosen as sparse-state
  fixtures** (not just Antoine). Confirmed field names feed back into Phase B.
- **Acceptance**: audit doc committed; Phase B mappers reconciled to real schema.

### Phase C — BFF (after B; parallel with D, E)
- Aura HTTP Query API client (`fetch`, **not** `neo4j-driver`); `AbortController` ~9s →
  `503 {status:"waking", retryAfter}`. Endpoints: `/api/musicians/curated`,
  `/api/musicians/:id`, `/api/musicians/:id/graph`, `/api/musicians/search-index`,
  `/api/health`. Server-side aggregation; cache headers per Architecture.
- Curated endpoint: read repo curated IDs+hooks, hydrate from Neo4j.
- **Duplicate observability (NO dedup)**: the search-index/corpus loader emits a
  structured warning to BFF logs when it detects suspected duplicates (same external ID —
  wikidata/musicbrainz/discogs — across distinct node IDs), for the populator owner. Data
  is still returned faithfully; nothing is filtered or merged.
- **Owns the first Aura HTTP-client integration smoke** (Phase 0 is MCP-only): unit tests
  for Cypher builders + Aura response parsing + timeout/waking path (mocked `fetch`);
  one live smoke gated behind an env flag (skipped in CI).
- Local dev: `wrangler` + `.dev.vars` (gitignored) mirroring `NEO4J_URI/USERNAME/PASSWORD`.
- **Live-Aura-smoke rule** (also in CLAUDE.md): before ANY Phase C commit that changes
  Cypher or Aura-response parsing, the implementer runs the smoke against live Aura
  **locally** and records the result in the PR. Not CI, not every commit — a mandatory
  manual gate for declaring Phase C green.
- **Acceptance**: green unit + contract tests vs Phase B types; live-Aura-smoke performed
  locally for any Cypher/parsing change; commit.

### Phase D — Mobile reader frontend (after B; parallel with C, E)
Consumes Phase B types via a mockable data hook (fixtures, so D doesn't block on C).
TDD + commit each sub-step; axe 0 (light+dark) per public view; visual baseline at end.
- **D1** Primitives: `Duo3` (duotone/initials, `photo:false` fallback), `ConnRow`,
  `MosaicV4`, `EraStrip`, `RecordsStrip`, `AttribPhoto/AttribAlbum`.
- **D2** Home: hero, ≥16px search input, journey row, curated-12 grid (mobile+desktop).
- **D3** Detail (mobile): identity, bio, listen (Spotify+Apple), mosaic, "Where to go"
  headliners (cap 16), expansion CTA + tail-marker, era/records strips, **sparse variant
  + duplicate flag** (Antoine + Phase 0 fixtures).
- **D4** Mosaic→ConnRow scroll + **pulse on scroll-LAND** (IntersectionObserver;
  reduced-motion = single frame).
- **D5** "More about" bottom **sheet**: portal to app-shell root, 280ms slide, backdrop
  fade, swipe-dismiss ≥80px, focus trap, `#about` hash ↔ Back/Esc.
- **D6** Autosuggest: client-side over cached corpus, 80ms debounce, 60ms stagger max 6,
  accent-fold match + original-offset `<em>` (no remount).
- **D7** Error/“waking” state: calm copy, cached fallback names, retry countdown;
  interprets BFF `503 status:"waking"`.
- **D8** Theme toggle (`@jazzlore/ui ThemeToggle` + `useTheme`) against the Phase B token layer.
- **Acceptance**: RTL behavior tests green; axe 0 each view ×2 themes; visual baselines
  (home, detail rich, detail sparse, autosuggest, sheet, error) committed.

### Phase E — Desktop graph view (after B; parallel with C, D)
- `d3-force` seeded from `hash(canonical_id)`; hand-rolled React/SVG; node size = record
  count, edge thickness = collaboration strength; a11y node labels; zoom/refit/toggle;
  **900ms ease-in-out click-to-recentre** with edge-weight interpolation + new-node fade;
  reduced-motion = snap. Consumes `/api/musicians/:id/graph` (fixtures).
- Prototype settle feel **first** across Miles(56)/Bobby(14)/Antoine(2).
- **Acceptance**: simulation deterministic under seed in unit tests (assert node/edge data
  + positions stable, no canvas needed); interaction tests; commit; **seeded** desktop
  visual baseline light+dark (NOT MD5 — see landmine 6).

### Phase F — Aura cron + runtime/deploy wiring (after C; may overlap D/E tail)
- `.github/workflows/keep-aura-warm.yml` (first workflow in repo): cron every 2 days +
  `workflow_dispatch` → `curl /api/health`.
- Implement deploy wiring for the **already-locked unified Worker** (Phase A): finalize
  `wrangler.musicians.jsonc` Worker `main` entry + assets binding. No runtime decision
  remains open at this phase.
- Ensure `.dev.vars` gitignored; document the **manual, out-of-repo** steps the user must
  do: Cloudflare project/domain + `NEO4J_*` env vars + GitHub auto-deploy hookup.
- **Acceptance**: e2e against local `wrangler dev` (5175 + Functions); `/api/health`
  returns a count; waking path exercised; commit.

### Phase G — E2E, a11y, perf, launch (after C+D+E+F; sequential final)
- `tests/e2e/musicians.spec.ts` (baseURL 5175): home → tap → detail → mosaic-scroll →
  more-about sheet (Back closes) → autosuggest → desktop graph recenter → waking state;
  reduced-motion deterministic.
- axe 0 on every public view light+dark incl. sheet-open and autosuggest-listbox-open.
- Lighthouse perf ≥90 / a11y ≥95; initial JS ≤100 KB gz (dynamic-import d3-force + graph
  chunk + heavy fonts subset); attribution captions present wherever license/attribution
  non-empty.
- **Post-deploy SEO check**: Google Search Console **URL Inspection** on a live musician
  page confirms the per-request OG/meta tags are seen correctly. **v1 explicitly accepts
  JS-hidden body content** (OG metadata suffices for social shares + search snippets);
  SSR/SSG revisited only if SEO later becomes a priority.
- Final review; **user-gated** merge (see landmine 14 — do NOT auto-deploy this app);
  post-deploy objective prod probe.

## Critical files (implementers must read before touching code)

- Design: `apps/musicians/docs/README.md`, `…/jazzlore-musicians-final.html`,
  `…/source/app/musicians5-app.jsx`, `…/musicians5-components.jsx`,
  `…/musicians5-styles.css`, `…/musicians5-readme.jsx`, `…/source/design-canvas.jsx`.
- Truth docs: `apps/musicians/docs/technical-note-musicians.md`,
  `apps/musicians/docs/FRONTEND.md`, and (after Phase 0) `…/docs/data-audit.md`.
- Inherit/copy: `apps/scales/{package.json,vite.config.ts,tsconfig.app.json,index.html}`,
  `apps/scales/src/{index.css,main.tsx,App.tsx,test/setup.ts,lib/useTheme.ts}`,
  `apps/chords/vite.config.ts` (port pattern), `apps/scales/CLAUDE.md`,
  `apps/chords/CLAUDE.md`, root `CLAUDE.md`.
- Reuse: `packages/ui/src/ThemeToggle.tsx`, `packages/ui/src/index.ts`,
  `packages/music-core/src/theme.ts` (`applyTheme/resolveInitialTheme/setOverride`).
- Root wiring: `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.workspace.ts`,
  root `package.json`, `playwright.config.ts`, `wrangler.jsonc` + `wrangler.chords.jsonc`
  (template for `wrangler.musicians.jsonc`), `eslint.config.js`.

## Landmines (app-specific foot-guns)

1. **Pages-Functions vs Workers fork — RESOLVED, locked at Phase A: unified Worker**
   (Static Assets + `/api/*` + HTMLRewriter), not a separate Pages project. The technical
   note says "Pages Functions" but the monorepo deploys via Workers (`wrangler.*.jsonc`)
   with dashboard GitHub auto-deploy already wired for Workers — unified Worker is the
   low-divergence path. BFF file layout follows this from the start; do **not** introduce
   a `functions/` Pages dir or `neo4j-driver`.
2. **Aura Free auto-pauses after 3 days idle** → first request 20–40 s. BFF must
   `AbortController`→503 `waking`; the cron mitigates but **CI/e2e must use fixtures**,
   never live Aura; live smoke env-gated.
3. **`neo4j-driver` is unsupported on CF V8.** Use the Aura HTTP Query API + `fetch`.
   Do not let an agent `npm i neo4j-driver`.
4. **100 k req/day CF free tier is shared across scales+chords+musicians.** One page =
   one BFF call; aggressive edge cache; autosuggest is client-side over the cached corpus
   (no per-keystroke calls).
5. **Design has its own token + font system** (not stone/amber, no StickyHeader). Don't
   blind-inherit scales/chords `index.css`; build + freeze the musicians token layer in
   Phase B; self-host Geist/Geist Mono/Newsreader within the perf budget.
6. **Force-directed graph breaks the repo's MD5-identical visual gate** (non-deterministic
   physics). Seed the sim; baseline via seeded layout + tolerance or structural assertion
   — explicitly NOT the scales/chords MD5 procedure.
7. **Mosaic pulse fires on scroll-LAND, not tap** (else clips); needs IntersectionObserver
   — jsdom has no IO or matchMedia (project quirk): guard + mock in tests.
8. **Bottom sheet must portal OUT to app root** (same lesson as the sticky-header work)
   or it can't overlay a scrolled container; focus-trap + swipe + `#about`/Back.
9. **Autosuggest fold**: match on NFD-stripped, render original, offsets from the
   ORIGINAL string; never remount the `<em>` (focus loss).
10. **`photo:false` is data** (`picture_url` presence), never a name heuristic.
11. **Known duplicate node (Antoine Hervé).** Duplicates are an **upstream data-quality
    issue owned by the populator** — the frontend renders them **faithfully, NO
    client-side dedup**. The BFF corpus/search-index loader instead logs a **structured
    warning** on suspected duplicates (matching external IDs across distinct node IDs)
    for the populator owner. The user-facing duplicate flag (Antoine sparse-state design)
    stays exactly as designed. Do not add a mapper-level dedup.
12. **`.dev.vars` must be gitignored**; `NEO4J_*` only in CF env + local `.dev.vars`;
    never in bundle/repo.
13. **TS strictness** (`erasableSyntaxOnly`, `verbatimModuleSyntax`,
    `noUncheckedIndexedAccess`): no enums/param-properties, type-only imports, guard
    index access — applies to d3-force typings too.
14. **Deploy autonomy does NOT extend here.** The standing "auto-merge at end of verified
    feature, user tests in prod (no traffic)" was for static zero-risk apps. Musicians has
    live external deps + secrets → **user-gated first deploy** + a secret/dashboard
    provisioning checklist. Do not auto-merge.
15. **Cloudflare GitHub auto-deploy + domain + secrets are dashboard (out-of-repo)
    actions the user must do** — agents cannot. Phase F documents the exact checklist.

## Highest-risk pass-5 elements to implement faithfully + mitigation

1. **Graph re-centre choreography** (900 ms settle + edge interpolation + node fade,
   "alive not stuttery", seeded-reproducible) — *highest risk.* Mitigate: isolate Phase E;
   prototype feel first on Miles/Bobby/Antoine; seed RNG; `react-force-graph` fallback
   documented; reduced-motion = snap; accept a tuned approximation.
2. **Mosaic→scroll→pulse-on-land** timing — IntersectionObserver, pulse on intersection
   not tap, cleanup after 1.4 s, reduced-motion single frame, IO-mock unit test.
3. **Bottom-sheet portal + swipe-dismiss + focus-trap + `#about`** — portal to app shell;
   test all dismiss paths (backdrop / swipe ≥80px / × / Esc / Back); focus trap; hash sync.
4. **Autosuggest fold/offset/stagger** — precompute `(original,folded)` at corpus load;
   offsets from original; stable keys; 60 ms stagger max 6.
5. **Sparse-data fidelity** — Phase 0 supplies 3+ worst-coverage fixtures; test all
   breakpoints; a11y labels stay meaningful; duplicate flag shown once.
6. **Token/typography divergence** — dedicated token layer Phase B; self-hosted fonts;
   font perf budget enforced in Phase G.

## Verification

- Per phase: `pnpm typecheck && pnpm lint && pnpm test:run` explicit pass; `pnpm build`
  (all 3 apps) before any commit that touches root wiring.
- Phase 0: `apps/musicians/docs/data-audit.md` committed; mappers reconciled to schema.
- Phases D/E: axe-core 0 violations each public view ×2 themes; Playwright-MCP visual
  baselines committed (seeded for graph).
- Phase C: unit + contract tests green; **live Aura smoke run locally** for any commit
  changing Cypher/response parsing (recorded in PR; not CI).
- Phase F: e2e vs local `wrangler dev`; `/api/health` returns count; waking path proven;
  `.dev.vars` confirmed gitignored; no secret in bundle.
- Phase G: `pnpm test:e2e` green incl. `musicians.spec.ts`; Lighthouse perf ≥90 /
  a11y ≥95; initial JS ≤100 KB gz; attribution captions verified; Google URL Inspection
  confirms OG/meta on a live musician page (JS-hidden body accepted for v1).

## Ship

Branch off `origin/main` → execute phases A→G (B+0 parallel; C/D/E parallel after the
Phase B contract+token freeze; F after C) → two-stage review per phase, green commit per
phase → **user-gated** PR/merge (NOT auto-deploy — landmine 14) → after the user
provisions Cloudflare project/domain/secrets + GitHub auto-deploy (landmine 15), deploy →
objective prod probe (DOM/health/computed-style, never eyeball) → on-device mobile +
desktop-graph spot-check by the user.
