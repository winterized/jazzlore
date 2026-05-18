# Jazzlore Musicians — spec (v1)

Distilled from `apps/musicians/docs/technical-note-musicians.md`, the Claude Design pass-5 handoff (`apps/musicians/docs/README.md` + `jazzlore-musicians-final.html` + `source/app/musicians5-*`), the Neo4j schema (`apps/musicians/docs/FRONTEND.md`), and the approved plan (`apps/musicians/docs/plans/2026-05-18-musicians-v1.md`). This is the scannable contract; the design HTML is the visual source of truth, FRONTEND.md is the data source of truth.

## Product goal

A mobile-first, tap-driven jazz-musician navigator over a Neo4j graph of musicians, records, and `:PLAYED_ON` relationships. Casual listeners tap a musician → see who they played with, read a one-line bio, and deep-link to Spotify / Apple Music. **Win condition: the user leaves with 2–3 new musicians or records they want to hear.** Everything else serves that. Third app in the monorepo; the first with a backend.

## Screens

| Screen | Anatomy |
|---|---|
| **Home** | hero invitation · visible search bar (≥16px input) · "Start a journey" row (random / era / label) · curated 12 with hand-written hooks. |
| **Detail (mobile)** | header → identity strip → 1-line bio + listen (Spotify + Apple) → image-only mosaic → ranked rail of 16 "fat" headliner connection cards → "Show all N →" expansion CTA (only when `total > 16`; has a preview line) → expanded long tail as same-treatment fat cards w/ italic tail-marker → "From the same era" strip → "Records they shaped" strip. Same layout at every data density. |
| **Detail (rich vs sparse)** | Identical composition. Rich = Bobby Timmons (~14 collab) / Miles Davis (56 of ~100). Sparse = Antoine Hervé (~2 collab, no bio, no portrait, possible duplicate → explicit duplicate flag + "No portrait on file" placeholder, never silent). Phase 0 supplies 3+ worst-coverage fixtures. |
| **Autosuggest** | Client-side over the cached search corpus. 80ms debounce, 60ms stagger (max 6 results). Accent-folded match (`NFD` + strip `\p{Diacritic}`) against `name` + `aka`; render the original string; `<em>` highlight offsets from the original; never remount the `<em>`. |
| **"More about" sheet** | Bottom sheet, portaled to the app-shell root (not the scrolled panel). 280ms slide + 200ms backdrop fade. Dismiss: backdrop tap / ↓ swipe ≥80px / × / Esc / browser Back. State is the `#about` hash (link-addressable, Back/Esc close it). Focus-trapped while open. |
| **Desktop graph** | Desktop only. Rail spine left (480px) + force-directed graph as a permanent right side panel. Click a node → 900ms ease-in-out re-centre (physics re-settles, edge weights interpolate in lockstep, new nodes fade in). `d3-force` seeded from `hash(canonical_id)` for cold-start reproducibility; positions NOT frozen. Reduced-motion → snap. |
| **Waking / error** | BFF `503 {status:"waking"}` → calm "waking up" state with cached fallback names + retry countdown. Neo4j unreachable → calm error tone, cached fallback names. Never a raw error. |

Motion (from the design handoff): mosaic-tap pulse 1.4s ease-out single iteration (fires on scroll-LAND, not tap); mosaic-tap scroll 360ms `cubic-bezier(.22,.61,.36,1)` `scrollIntoView({block:'center'})`; "Show all" expansion 320ms; graph re-centre 900ms; sheet 280ms `cubic-bezier(.32,.72,0,1)`. `prefers-reduced-motion: reduce` clamps everything (pulse single-frame, scroll instant, graph snaps).

## Data model summary

Neo4j Aura Free, read-only. Full schema + example Cypher in `apps/musicians/docs/FRONTEND.md`. Confirmed field names after Phase 0 in `apps/musicians/docs/data-audit.md`.

- **`:Musician`** — `id` (e.g. `wikidata:Q132341`), `name`, `aka[]`, `primary_instruments[]`, `all_instruments[]`, birth/death year+date+place, `years_active_start/end`, `nationality`, `genres[]`, `picture_url` + `picture_license` + `picture_attribution`, `wikipedia_url`, `wikidata_id`/`musicbrainz_id`/`discogs_id`, `bio_summary`. Most fields may be absent (sparse handling required). `photo:false` is **data** — derived from `picture_url` presence, never a name heuristic.
- **`:Record`** — `id`, `title`, `type`, `secondary_types[]`, `is_various_artists`, `release_year`, `recording_year`, `recording_location`, `label`, `catalog_number`, `producer[]`, `engineer[]`, `track_count`, `cover_art_url` + `cover_art_license`, external IDs. No per-track data in v1.
- **`(:Musician)-[:PLAYED_ON]->(:Record)`** — `instruments[]`, `role` (leader/co-leader/sideman/guest/vocalist/composer/arranger), `tracks` (`"all"` or `int[]`).
- **Collaborators** are derived: two musicians sharing a `:Record` via `:PLAYED_ON`. Aggregate server-side (count, top shared record, instrument/relationship line).
- **Image attribution is mandatory** (legal): render the caption whenever any `*_license`/`*_attribution` is non-empty.

## API surface (BFF, Phase C)

Small REST, server-side aggregated, edge-cached. One page load = one BFF call.

| Endpoint | Returns | Cache |
|---|---|---|
| `GET /api/musicians/curated` | Home curated list (12 + metadata), repo IDs+hooks hydrated from Neo4j | 12h |
| `GET /api/musicians/:id` | Full detail incl. top-N collaborators + top-M records | 1–2h |
| `GET /api/musicians/:id/graph` | Graph nodes + edges for the desktop view | 1–2h |
| `GET /api/musicians/search-index` | Full autosuggest corpus `[{id,name,aka,primary_instrument,era}]`; fetched once/session, matched client-side | 6h |
| `GET /api/health` | `MATCH (m:Musician) RETURN count(m)` smoke for the wake-up cron | no-store |

Aura wake-up: `AbortController` ~9s → `503 {status:"waking", retryAfter}`. Cron (`.github/workflows/keep-aura-warm.yml`, every ~48h) pings `/api/health` to keep Aura warm.

External links (search deep-links, no API integration v1, both services equal):
- Spotify musician `https://open.spotify.com/search/{encodeURIComponent(name)}` · record `…/search/{title} {primaryArtist}`
- Apple musician `https://music.apple.com/search?term={encodeURIComponent(name)}` · record `…?term={title} {primaryArtist}`

## v1 scope

**IN:** home (hero + search + journey row + curated 12), mobile detail (rich + sparse), autosuggest (cached corpus, accent-fold), "More about" bottom sheet, desktop force-directed graph + re-centre, waking/error states, both themes, both breakpoints, Spotify + Apple deep-links, mandatory image attribution captions, per-request OG/meta injection (HTMLRewriter) + dynamic `/sitemap.xml`.

**OUT:** "path between two musicians" (v2); filters / facets; per-track listings; user accounts / history (≤ localStorage); audio previews / embedded players; mobile graph view (desktop-only); `neo4j-driver`; a Pages `functions/` dir; SSR/SSG (v1 accepts JS-hidden body — OG-only suffices, revisited only if SEO becomes a priority).

## The 8 locked decisions

1. **Curated home list** → hybrid: hand-picked IDs + hand-written hooks in `src/data/curated.ts`; BFF hydrates names/images live from Neo4j (single source of truth for facts, deliberate selection).
2. **Graph library** → `d3-force` + hand-rolled React/SVG renderer (full control of editorial aesthetic, theme vars, a11y, 900ms re-centre). `react-force-graph` is the documented fallback.
3. **"More about" expansion** → bottom sheet as designed **+ `#about` hash** (Back/Esc close it, open state link-addressable, no separate route/SEO surface).
4. **OG/SEO metadata** → per-request injection via the unified Worker (HTMLRewriter rewrites `<meta>`/OG per musician) + dynamically served `/sitemap.xml` from the cached corpus. Edge-cached.
5. **Phase 0 data audit** → Neo4j MCP queries only (ephemeral) → `apps/musicians/docs/data-audit.md`. The first real Aura HTTP-client integration smoke moves into Phase C.
6. **Runtime** → a single **unified Cloudflare Worker** (static assets + `/api/*` + HTMLRewriter), NOT a Pages-Functions project. Locked Phase A constraint. No `functions/` dir.
7. **SEO posture (v1)** → per-request OG/meta; **JS-hidden body content explicitly acceptable for v1**. Verified post-deploy via Google URL Inspection. SSR/SSG only if SEO later becomes a priority.
8. **Duplicate policy** → duplicates are an upstream populator-owned data-quality issue; frontend renders them **faithfully — NO client-side / mapper-level dedup**. BFF corpus loader logs a structured warning on suspected duplicates (matching external IDs across distinct node IDs) for the populator owner. The user-facing duplicate flag stays as designed.

## Verification bars

Per phase: `pnpm typecheck && pnpm lint && pnpm test:run` explicit pass; `pnpm build` (all 3 apps) before any commit touching root wiring. Phases D/E: axe-core 0 each public view ×2 themes + committed Playwright-MCP visual baselines (seeded for the graph — NOT the MD5 procedure, physics is non-deterministic). Phase C: unit + contract tests green + live Aura smoke run locally for any Cypher/parsing change (recorded in PR, not CI). Phase G: `pnpm test:e2e` incl. `musicians.spec.ts`; Lighthouse perf ≥90 / a11y ≥95; initial JS ≤100 KB gz; attribution captions verified; Google URL Inspection confirms OG/meta on a live page. **User-gated first deploy** (no auto-merge — live external deps + secrets).
