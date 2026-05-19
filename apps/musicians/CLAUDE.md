# Jazzlore — musicians app memory

The third sub-site of the Jazzlore portfolio: a public, polished, mobile-first jazz-musician exploration tool. Planned at <https://musicians.jazzlore.com>. **The first Jazzlore app with a backend.** See `/CLAUDE.md` at the repo root for workspace-wide context and conventions, and `apps/musicians/docs/specs/musicians.md` for the product spec, `apps/musicians/docs/plans/2026-05-18-musicians-v1.md` for the approved v1 plan.

## Inherited conventions (repo-wide, non-negotiable here too)

- **TDD by default.** Domain logic / pure helpers get a failing test first; UI tested via React Testing Library where behavior matters; visual fixes get tests too (extract a pure helper when behavior is buried in a component).
- **Read the spec first.** `apps/musicians/docs/specs/musicians.md`. Update the spec before guessing.
- **No `any`.** Use `unknown` and narrow.
- **Small files.** Components under ~150 lines; split when growing. Domain logic stays out of components.
- **Accessibility is not optional.** Keyboard nav, semantic HTML, ARIA, color contrast ≥ WCAG AA. Color is never the sole signal.
- **Mobile-first.** Tailwind breakpoints up from default → `md:` → `lg:`. The mobile detail screen IS the product; desktop adds the graph panel.
- **Conventional commits** with the trailer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **Text inputs ≥16px.** The autosuggest search input uses `text-[16px]` (or larger) so iOS Safari doesn't auto-zoom on focus. Add `autoCorrect`/`autoCapitalize="off"` + `spellCheck={false}` + `inputMode` for the search field.
- **Dual-variant CSS-gated controls → test with `getAllBy`/`within`.** When the a11y pattern mounts both responsive variants and hides one via Tailwind, jsdom doesn't evaluate the media classes so the element appears twice in unit tests: never `getBy*` it — use `getAllBy*` or scope with `within(...)`. Real-browser e2e is unaffected.
- No `console.log`, no `any`, no TODO without a linked issue. Lighthouse perf ≥ 90, a11y ≥ 95; axe-core 0 violations every public view in both themes.

## App-specific stack

- **Build:** Vite (config at `apps/musicians/vite.config.ts`). Dev server pinned to **port 5175** so Playwright's multi-app `webServer` array targets all three apps deterministically (scales 5173, chords 5174, musicians 5175).
- **Framework:** React 19 + TypeScript strict (`erasableSyntaxOnly` → no enums / no parameter-properties; `verbatimModuleSyntax` → type-only imports via `import type`; `noUncheckedIndexedAccess` → guard every index access — applies to d3-force typings too).
- **Routing:** React Router v7 (`react-router`, `BrowserRouter`). Routes: `/` → `/musicians`, `/musicians` (home), `/musicians/:id` (detail; `:id` is the Neo4j node `id`, e.g. `wikidata:Q132341`), catch-all → `/musicians`. The "More about" sheet is a `#about` hash on the detail route, not a separate route. SPA fallback via the unified Worker's `not_found_handling: "single-page-application"`.
- **Styling:** Tailwind v4 (CSS-first). The musicians app ships its **own design-token system** (`--bg/--paper/--card/--accent`; fonts Geist / Geist Mono / Newsreader) — **NOT** the stone/amber tokens of scales/chords, and **no StickyHeader**. The token layer + self-hosted fonts are built and **frozen in Phase B**; `src/index.css` carries only a minimal placeholder until then. Dark mode via `data-theme="dark"` (set on `<html>` by `@jazzlore/music-core` `applyTheme`).
- **Data:** Neo4j Aura Free, read-only from this app. Schema in `apps/musicians/docs/FRONTEND.md`; confirmed field names land in `apps/musicians/docs/data-audit.md` after Phase 0.
- **Data access:** the BFF talks to Aura via the **Aura HTTP Query API + `fetch`** — **NEVER `neo4j-driver`** (Cloudflare's V8 runtime doesn't support it; do not `npm i neo4j-driver`).
- **Runtime:** a single **unified Cloudflare Worker** — static assets + `/api/*` fetch handler + (Phase 4) HTMLRewriter OG injection. `wrangler.musicians.jsonc` at repo root has a Worker `main` entry + an `ASSETS` assets binding. **There is no Pages `functions/` directory and there will not be one.** Worker entry: `apps/musicians/worker/index.ts`.
- **Shared UI:** reuse is limited to `@jazzlore/ui` `ThemeToggle` + the app `useTheme()` pattern (`src/lib/useTheme.ts`). `@jazzlore/music-core` contributes only `applyTheme/resolveInitialTheme/setOverride`; no music-theory code here (the ESLint `no-restricted-imports` boundary is unchanged).
- **Persistence:** at most `localStorage` in v1 (no auth, no accounts). If used, go through the storage seam, never raw `localStorage`.

## Source structure (`apps/musicians/src/`)

```
data/             curated.ts — hand-picked musician IDs + hand-written hook lines (Phase B/C)
lib/              pure, React-free, fetch-free domain types + mappers + link/caption builders + accent-fold (Phase B); useTheme wrapper
pages/            Route components (HomePage, MusicianPage)
test/setup.ts     vitest setup (jest-dom + localStorage polyfill for Node 26 + jsdom 29 + Vitest 4)
worker/index.ts   unified Cloudflare Worker (static assets + /api/*; Phase C fills the BFF)
```

## BFF / Cypher conventions

- **One page load = one BFF call.** Server-side aggregation; the 100k req/day CF free tier is shared across scales + chords + musicians. Autosuggest is **client-side over a cached search corpus** (`/api/musicians/search-index`) — no per-keystroke backend calls.
- Cypher queries are **parameterized** (never string-interpolated) and **read-only** (`MATCH … RETURN …`; no `CREATE`/`MERGE`/`SET`/`DELETE`).
- Aura via `fetch` + the HTTP Query API. `AbortController` ~9s → `503 {status:"waking", retryAfter}`; the frontend renders the designed "waking up" state. CI/e2e use fixtures, never live Aura.
- Endpoints (Phase C): `/api/musicians/curated`, `/api/musicians/:id`, `/api/musicians/:id/graph`, `/api/musicians/search-index`, `/api/health`. Edge cache: curated 12h, detail 1–2h, search-index 6h, health no-store.
- Credentials (`NEO4J_URI/USERNAME/PASSWORD`) live only in Cloudflare env + local `.dev.vars` (gitignored) — never in the bundle or repo.

### Live-Aura-smoke rule

> Before any Phase C commit that changes Cypher or Aura-response parsing, run the Aura smoke against live Aura locally and record the result in the PR. Not CI, not every commit — a mandatory manual gate for declaring Phase C green.

## Image attribution (legal requirement, not polish)

Wikimedia Commons CC-BY / CC-BY-SA licenses **legally require attribution**. For every rendered `picture_url` (musician portrait) or `cover_art_url` (album cover), render the caption *whenever any of the `*_license` / `*_attribution` fields is non-empty*. Public-domain images have empty fields → caption renders nothing; missing portraits get an explicit italic placeholder, never silent. Treat this as a non-negotiable spec requirement.

## Duplicate policy

Duplicates (e.g. the known Antoine Hervé double-node) are an **upstream data-quality issue owned by the populator**. The frontend renders them **faithfully — NO client-side dedup**, and no mapper-level dedup. The BFF corpus / search-index loader instead logs a **structured warning** on suspected duplicates (matching external IDs — wikidata / musicbrainz / discogs — across distinct node IDs) for the populator owner. The user-facing duplicate flag (Antoine sparse-state design) stays exactly as designed.

## Neo4j read-only policy

<!-- TODO(user): fill after verifying the Neo4j MCP works -->

## Definition of done (per feature)

- [ ] Spec in `apps/musicians/docs/specs/musicians.md` (or `docs/specs/<feature>.md`) up to date.
- [ ] Unit tests for domain logic / mappers / builders green; component behavior tests where it matters.
- [ ] Renders correctly on mobile and desktop, light and dark themes.
- [ ] Keyboard accessible; axe-core 0 violations (both themes).
- [ ] No `console.log`, no `any`, no TODO without a linked issue.
- [ ] Image-attribution captions present wherever any license/attribution field is non-empty.
- [ ] Lighthouse: perf ≥ 90, a11y ≥ 95; initial JS ≤ 100 KB gz (dynamic-import d3-force + graph + heavy fonts subset).
- [ ] Live-Aura-smoke performed locally for any Phase C commit changing Cypher / response parsing (recorded in PR).

## Learning goals (Aurélien)

This project is also a learning instrument and the first to use the oh-my-claudecode (OMC) multi-agent flow rather than the Superpowers subagent flow. When there's tension between "ship fastest" and "learn modern practice", lean toward learn — and explain the tradeoff. Treat me as a senior engineer returning from a long break, not a beginner.

## Out of scope (this app, v1)

- "Path between two musicians" feature — defer to v2.
- Filters / search facets (by era, genre, instrument) — casual users tap, they don't filter.
- Per-track listings on record pages — data not yet exposed in Neo4j.
- User accounts / saved-musicians / history — at most `localStorage`.
- Audio previews / embedded players — deep-link to Spotify / Apple Music suffices.
- The mobile graph view — desktop only; mobile uses the detail screen as the entire product.
- `neo4j-driver`, a Pages `functions/` dir, SSR/SSG (v1 accepts JS-hidden body + per-request OG injection).

## Deploy posture

**User-gated first deploy** (the standing auto-merge autonomy does NOT extend to this app — it has live external deps + secrets). Cloudflare project/domain + `NEO4J_*` env vars + GitHub auto-deploy hookup are out-of-repo dashboard actions the user must perform; Phase F documents the exact checklist. Do not auto-merge.
