# Technical note — Jazzlore Musicians

> Accompanies the Claude Design handoff (`design_handoff_musicians/`). Read both before planning. The design handoff describes *what to build visually*; this note describes *the constraints, stack, and pre-work* that bound it.

## Product summary

A mobile-first jazz-musician exploration tool. Casual jazz listeners tap through musicians, discover collaborators, read short bios, and deep-link to Spotify and Apple Music to actually listen.

Lives at `musicians.jazzlore.com`. Third app in the `apps/` directory of the existing Jazzlore monorepo, alongside `apps/scales/` and `apps/chords/`.

**Pitch:** *A mobile-first exploration tool for casual jazz listeners — tap any musician to discover who they played with, hear what defined them, and find new artists worth listening to.*

## Stack (locked)

| Concern | Choice | Notes |
|---|---|---|
| Monorepo location | `apps/musicians/` | Same pnpm workspace as scales and chords. |
| Build | Vite + React 18 + TypeScript (strict) | Match existing apps. |
| Package manager | pnpm | Workspace already configured. |
| Routing | React Router (same major as scales/chords) | SPA navigation; browser history must work for tap-back behavior. |
| Styling | Tailwind v4 (stone + amber palette) | Tokens shared with scales/chords; no new `--jl-*` variables. Dark mode via `data-theme="dark"` per existing convention. |
| Testing | Vitest + Testing Library + Playwright | Same patterns as the other apps. |
| Linting / formatting | ESLint + Prettier | Workspace-level config applies. |
| Deployment | Cloudflare Pages | Subdomain `musicians.jazzlore.com`. New Pages project, auto-deploy from `main`. |
| Backend (BFF) | Cloudflare Pages Functions | Talks to Neo4j Aura via HTTP Query API. Holds credentials in env vars; the browser never sees them. |
| Data source | Neo4j Aura Free | Read-only from this app's perspective. Populator runs separately (see `FRONTEND.md`). |
| Data access | Aura HTTP Query API + `fetch` | NOT the `neo4j-driver` package — Cloudflare Workers runtime (V8, not Node) doesn't fully support it. HTTP API works natively with the `fetch` available in Workers. |
| Caching | Cloudflare edge cache, 1–2h TTL on detail pages | Aura updates every 4h, so 1–2h is safe and dramatically reduces backend invocations. |
| Shared UI from monorepo | `packages/ui` (theme toggle, design tokens) | The musicians app is a different *shape* from scales/chords, so don't expect heavy reuse — just the design system primitives. `packages/music-core` likely contributes nothing to this app. |
| Execution tooling | oh-my-claudecode (OMC) plugin | First Jazzlore project to use OMC. See "Execution model" below. |

## Execution model

This is the first Jazzlore project that uses **oh-my-claudecode (OMC)** for multi-agent orchestration, rather than the Superpowers subagent flow used on scales, chords, and the sticky header. The project shape justifies the change: four genuinely parallel surfaces (data audit, BFF/backend, mobile reader frontend, desktop graph view) that benefit from specialized agents working in parallel rather than a single orchestrator coordinating sequential tasks.

### Why OMC here, not before

Previous Jazzlore projects were sequential by nature:
- Scales and chords: pure-frontend, content-driven, one workstream at a time.
- Monorepo refactor: structurally sequential — extracting packages requires order.
- Sticky header / 2-col grid: small, focused, single-surface changes.

The musicians project is the first with **multiple independent surfaces that can progress in parallel**:
- Phase 0 data audit (Cypher / data quality work)
- BFF on Cloudflare Pages Functions (backend, request shapes, error handling, Aura wake-up logic)
- Mobile reader frontend (the heart of the product, screen-by-screen)
- Desktop graph view (rendering library evaluation, force-directed layout, interaction)

These don't block each other after the initial schema is agreed. OMC's specialized agents (Explorer, Librarian, etc.) and parallel execution modes earn their keep on this shape of work.

### What the plan should assume

The implementation plan Claude Code produces should:

1. **Identify which phases can run in parallel** vs. which must be sequential. Phase 0 (data audit) blocks everything user-facing. Phase 1 (app skeleton + BFF scaffold) blocks the rest. After Phase 1, mobile reader work and desktop graph work can proceed in parallel via separate OMC agents.
2. **Maintain TDD discipline across parallel work.** OMC's parallelism doesn't suspend the red-green-refactor cadence; it just runs multiple cadences at once. Each agent owns its own test files; integration tests catch the seams.
3. **Use git worktrees** for genuinely parallel branches when OMC agents work on independent file sets. The monorepo refactor established this pattern.
4. **Define a clear hand-off point per phase.** OMC's value collapses if agents end up waiting on each other or stepping on shared files. The plan should pre-decide which files each surface owns.

### What stays the same

- TDD throughout (red → green → refactor → commit).
- Visual baseline screenshots before any visual refactor.
- Two-stage review (implementer agent → reviewer agent) at the end of each phase.
- User-gated merge to `main` (Cloudflare auto-deploys from `main`).
- Plan mode in Claude Code for the planning step, not Superpowers' planning skill.

### MCP servers required for this project

In addition to the MCPs already wired in the monorepo (Playwright, Context7), this project adds two:

- **Neo4j MCP server** (`@neo4j/mcp-server-cypher`): lets agents introspect the live Aura database during development — run Cypher queries, validate BFF response shapes against real data, inspect schema, sanity-check the Phase 0 audit. Configured with read-only credentials (see "Aura credentials and MCP configuration" below). The CLAUDE.md for this app must include the line: *"Neo4j is read-only from this project; never run write queries."*
- **Cloudflare MCP server**: useful for the deploy phase (Phase N) — lets agents inspect Pages projects, Workers, KV namespaces, and deployment status without context-switching to the dashboard. Optional for spec/plan stages; recommended once execution reaches deploy.

### Aura credentials and MCP configuration

Neo4j Aura credentials (URI, username, password) live in three places, none of which is the repo:

1. **Cloudflare Pages environment variables** — used by the production BFF. Set in the Cloudflare dashboard for the musicians Pages project: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`.
2. **Local `.dev.vars` file** (gitignored) — used by `wrangler dev` for local BFF testing. Mirrors the Cloudflare env var names.
3. **MCP server config** — used by Claude Code for live database introspection during development. Configured via `claude mcp add` with environment variables, or in `~/.config/claude/mcp.json` under the `neo4j` server's `env` block:

```json
{
  "mcpServers": {
    "neo4j": {
      "command": "npx",
      "args": ["-y", "@neo4j/mcp-server-cypher"],
      "env": {
        "NEO4J_URI": "neo4j+s://...",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "..."
      }
    }
  }
}
```

The credentials are the same as the populator's `.env` (read-only access is sufficient for both the production BFF and the dev-time MCP). Never commit any of the three locations. The `.gitignore` should already cover `.dev.vars`; verify.

### What the implementer should verify upfront

Before Phase 1, confirm:
- OMC is installed and the available agents are listed (`/agents` or equivalent).
- The plan explicitly names which agent owns which surface.
- The team-style throughput is real, not theatrical — if two "parallel" agents end up serializing on shared files, the gain evaporates. Worth a 5-minute pre-flight check.

## Phase 0 — Data audit (do before any frontend work)

**Why this exists:** The product's value depends on user trust. Casual listeners will lose trust quickly if they encounter visible data quality issues. Known issue surfaced during product planning: *Antoine Hervé* is duplicated in the database (populator failed to merge two source records for the same person). There are likely other instances of this class of bug. The frontend must either *fix* these or *gracefully acknowledge* them. Either is acceptable; *silently rendering broken data* is not.

### Phase 0 deliverables

Before the frontend's first screen renders real data, perform a data audit and produce two outputs:

1. **A duplicate-detection pass.** Run heuristic checks against the existing Neo4j data to surface likely-duplicate `:Musician` nodes. Suggested heuristics:
   - Same `name` (case-insensitive) with different `id`s
   - Overlapping `aka` lists
   - Similar names (Levenshtein distance ≤ 2) plus overlapping `primary_instruments` or `years_active_*`
   - Same `wikidata_id`, `musicbrainz_id`, or `discogs_id` on different nodes (should be impossible but worth asserting)

   Output: a list of suspected duplicates with a confidence score and the evidence (which fields matched). For high-confidence duplicates (e.g. shared external ID), produce merge SQL/Cypher; for low-confidence ones, log for manual review. Coordinate with the populator owner — fixes happen in the populator, not in the frontend's BFF.

2. **A field-coverage map for the 50 musicians most likely to be tapped.** "Likely to be tapped" means highest edge count (most collaborations) plus the curated home-screen entry points. For each, list which fields are present and which are missing. This becomes the test matrix for the design's sparse-state handling. Most graceful failures will be triggered by these 50; if the design handles them, it handles the long tail too.

These two deliverables block the frontend in two specific ways:
- The duplicate list is fed to the populator owner; the frontend doesn't ship until the highest-impact duplicates are fixed *or* the frontend explicitly accepts them with a "data quality" affordance in the UI.
- The field-coverage map drives which sparse-state cases get tested explicitly. Antoine Hervé is one test case; the audit will surface 5–10 more that the design must handle.

### Phase 0 success criteria

- Suspected duplicate count is known and triaged (fixed in populator OR explicitly accepted with documented UI handling).
- The 50-musician field-coverage map is captured as a CSV or markdown table in `apps/musicians/docs/data-audit.md`.
- The design's sparse-state mock has been validated against at least the 3 worst-coverage musicians in the audit (not just Antoine Hervé).

## Aura wake-up handling

Neo4j Aura Free auto-pauses after **3 days of idle**. The first request after a pause hangs for **20–40 seconds** while the instance comes back online. If the musicians app gets bursty traffic with quiet periods, users will hit this regularly.

### Two-part strategy

**1. Backend: gracefully handle the wake-up.** The BFF should detect a slow-or-timing-out Aura response (suggested threshold: 8 seconds) and return a structured "waking up, please retry" response to the frontend rather than letting the connection hang. Implementation sketch:

```ts
// Inside a Cloudflare Pages Function
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);
try {
  const result = await fetch(NEO4J_HTTP_QUERY_URL, { signal: controller.signal, ... });
  // ...normal handling
} catch (err) {
  if (controller.signal.aborted) {
    return Response.json({ status: 'waking', retryAfter: 10 }, { status: 503 });
  }
  throw err;
}
```

The frontend interprets `status: 'waking'` and shows a designed "waking up" state (per design handoff) rather than an error.

**2. Cron: prevent the pause in the first place.** Set up a GitHub Action that pings the BFF every ~48 hours to keep Aura warm. Cheap, idempotent, prevents the user-visible hang in 95% of cases. Suggested workflow:

```yaml
# .github/workflows/keep-aura-warm.yml
name: Keep Aura warm
on:
  schedule:
    - cron: '0 12 */2 * *'  # every other day at noon UTC
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS https://musicians.jazzlore.com/api/health
```

The BFF exposes `/api/health` which makes a trivial `MATCH (m:Musician) RETURN count(m) AS n LIMIT 1` query. The cron keeps Aura active without touching real user-facing endpoints.

**3 days idle → pause** is the documented behavior. Pinging every 2 days is a comfortable margin.

## BFF design constraints

### Request budget

Cloudflare Pages Functions: 100,000 requests/day on the free tier, shared across all your Pages projects. Practical implications:

- Aggregate Neo4j queries server-side. **One frontend page load = one BFF call**, not eight. The BFF assembles whatever data structure the frontend needs from one (or at most a few) Cypher queries.
- Cache aggressively. Edge cache TTL 1–2h on detail pages is safe (Aura updates every 4h).
- The cron above (every 2 days) costs ~15 requests/month. Negligible.

### Credentials

Neo4j connection URI, username, and password live in **Cloudflare Pages environment variables** (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`). The frontend bundle never contains them. The populator owner provides them out-of-band; do not commit them anywhere.

### API shape (suggested)

A small REST surface, not GraphQL — the read patterns are simple and well-known:

| Endpoint | Returns | Cache |
|---|---|---|
| `GET /api/musicians/curated` | The home-screen curated list (12 musicians + metadata) | 12h (rarely changes) |
| `GET /api/musicians/:id` | Full musician detail, including top N collaborators and top M records | 1–2h |
| `GET /api/musicians/search-index` | The full autosuggest corpus: `[{id, name, aka, primary_instrument, era}, ...]` for every musician in the DB. Frontend fetches this once per session and runs prefix matching client-side. **No per-keystroke backend calls.** | 6h (Aura updates every 4h; mild eventual consistency accepted for autosuggest) |
| `GET /api/musicians/:id/graph` | Graph data (nodes + edges) for the desktop graph view | 1–2h |
| `GET /api/health` | Smoke test, used by the wake-up cron | no cache |

### Why client-side autosuggest

The autosuggest corpus is small (well under 100 KB even at thousands of musicians) and slow-changing. Shipping it to the browser at page load and matching client-side eliminates per-keystroke backend calls, gives literal typing-speed UX with no network spinner, decouples the most common interaction from Aura's wake-up behavior, and reduces autosuggest request volume by ~99% vs. the naive per-keystroke design. The mild staleness (a musician added in the last 6 hours doesn't appear until the cache refreshes) is invisible at this usage pattern.

The implementation should handle accent-folding (so "antoine herve" matches "Antoine Hervé"), match against both `name` and `aka`, and gracefully handle the duplicate-musicians case surfaced by Phase 0 — duplicates appearing in autosuggest is the most user-visible data quality failure mode.

The `:id` matches the Neo4j `id` property (e.g. `"wikidata:Q132341"`). URLs in the frontend can use this directly.

## External link generation

The product surfaces Spotify and Apple Music links as primary calls-to-action. **Both services treated equally** — design and link parity. Implementation: simple search-deep-links, no API integration in v1.

### Spotify

- **Musician:** `https://open.spotify.com/search/{encodeURIComponent(name)}`
- **Record:** `https://open.spotify.com/search/{encodeURIComponent(`${title} ${primaryArtistName}`)}`

### Apple Music

- **Musician:** `https://music.apple.com/search?term={encodeURIComponent(name)}`
- **Record:** `https://music.apple.com/search?term={encodeURIComponent(`${title} ${primaryArtistName}`)}`

Both open in a new tab. For a v2 upgrade path, both services have proper APIs that can return canonical artist/album IDs — defer to v2; the search-deep-link is good enough for the win condition.

## Image attribution

**Mandatory** per Wikimedia Commons CC-BY and CC-BY-SA license terms.

For every rendered `picture_url` or `cover_art_url` that has a non-empty `*_license` or `*_attribution`, display a small caption near the image with:

> *Photo: {attribution} · {license}*

Public-domain images have empty attribution/license fields, in which case the caption renders nothing. The safest pattern: render the caption *whenever any of the attribution fields are non-empty*. Treat this as a non-negotiable spec requirement, not a polish item.

The design handoff specifies the visual treatment — likely small, tasteful, magazine-style captions.

## Out of scope for v1

Locked decisions from product planning. Do not let these creep into v1:

- **"Path between two musicians" feature** — defer to v2.
- **Filters / search facets** (by era, genre, instrument) — casual users tap, they don't filter.
- **Per-track listings** on record pages — data not yet exposed in Neo4j.
- **User accounts, saved-musicians, history** — at most localStorage in v1.
- **Audio previews / embedded players** — deep-link to Spotify/Apple Music suffices.
- **The mobile graph view** — desktop only. Mobile uses the detail screen as the entire product.

## Open questions for the implementation plan

The implementation plan (Claude Code's job) should resolve these before execution:

1. **Curated-list source of truth.** Where does the home-screen list of 12 musicians come from? Hand-curated JSON in the repo? Computed from edge counts? Probably hand-curated for editorial quality, but worth deciding.
2. **Graph rendering library.** Likely candidates: `react-force-graph`, `cytoscape.js`, `d3-force` with a hand-rolled React wrapper. Desktop only, so bundle size is less of a concern. Pick based on touch (well, click) interaction quality and aesthetic control.
3. **Sitemap and OG metadata.** Each musician detail page should be SEO-discoverable and shareable. The BFF or a build-time generator needs to emit per-page metadata. Defer the decision to implementation but don't forget it.

## What the Claude Code session should produce

1. A spec at `apps/musicians/docs/musicians.md` (mirroring scales/chords structure).
2. A plan from Claude Code's plan mode, refined against the design handoff and this technical note.
3. Phased execution: Phase 0 (data audit) is genuinely first; Phase 1 starts the app skeleton and BFF scaffold; subsequent phases follow the design handoff's component breakdown.

## Reading order for the implementer

1. The Claude Design handoff README (in the same bundle as this note).
2. This file (you're reading it).
3. `FRONTEND.md` from the JazzDBPopulator repo (schema, available fields, example queries).
4. The existing `apps/scales/` and `apps/chords/` source for stack patterns.
5. The existing monorepo's root `CLAUDE.md` for workspace conventions.
