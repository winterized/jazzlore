# Architecture

How the system is built today. Any change that makes this file wrong updates it in the same branch. Keep it to what a new session cannot see quickly in the code: the parts, where their boundaries are, how data moves between them, and why it is built this way.

First written 2026-10-09 from the old `CLAUDE.md` files and the old Claude auto memory (written May–June 2026) plus a read of the code. Items marked *(inferred)* come from reading the code and were not confirmed by the owner. Older, detailed history lives in each app's `docs/` folder and in git.

## Overview

A pnpm workspace (monorepo since 2026-05-14) of five static React 19 + Vite + Tailwind 4 single-page apps and two shared packages. Every app deploys as its own Cloudflare Worker with static assets. Only musicians has server code: its Worker also serves an API (a backend-for-frontend, "BFF") that reads a Neo4j Aura graph. The repo is public on GitHub (MIT, since 2026-05-27).

| App | Domain | Wrangler config (repo root) | Worker name | Dev port |
|---|---|---|---|---|
| `apps/landing` | `jazzlore.com` | `wrangler.jsonc` | `jazzlore-landing` | 5177 |
| `apps/scales` | `scales.jazzlore.com` | `wrangler.scales.jsonc` | `jazzlore` | 5173 |
| `apps/chords` | `chords.jazzlore.com` | `wrangler.chords.jsonc` | `jazzlore-chords` | 5174 |
| `apps/musicians` | `musicians.jazzlore.com` | `wrangler.musicians.jsonc` | `jazzlore-musicians` | 5175 |
| `apps/metronome` | `metronome.jazzlore.com` | `wrangler.metronome.jsonc` | `jazzlore-metronome` | 5176 |

The scales Worker is called `jazzlore`, not `jazzlore-scales`. It was the first Worker and once served the apex. When landing took over `wrangler.jsonc` (PR #97), the Worker kept its name and its dashboard config selector was pointed at `wrangler.scales.jsonc`. A Worker's `name` must match the dashboard project name.

The metronome, chords, scales and musicians web builds are also shipped as native iOS apps from the separate repo `winterized/jazzlore-ios` (Capacitor, see External services).

## Components

### Shared packages

- **`packages/ui` (`@jazzlore/ui`)**: a purely presentational React design system. It contains `PianoKeyboard`, `RootPicker`, `AbcScore` (lazy abcjs wrapper), `StickyHeader` (scales and chords), `ThemeToggle`, the PWA install button and sheet, `ShareButton`/`nativeShare`, `isNativeApp`, `hideNativeSplashAfterMount`, `appStoreLinks`, and the sheet hooks (`useFocusTrap`, `useSheetTransition`, `useBodyScrollLock`, `useSheetDrag`, `useSwipeDownDismiss`).
  - Components take pre-computed data (pitch classes, option lists, controlled state). It must not depend on `@jazzlore/music-core`, Tonal, Tone or abcjs; ESLint `no-restricted-imports` and its `package.json` enforce this.
  - Storybook 8 lives here (`pnpm storybook`).
- **`packages/music-core` (`@jazzlore/music-core`)**: music theory (scales, chords, spelling, ABC builders), the audio engine (Tone.js sampler, lazy-loaded), `primeAudio()`, storage, theme persistence and URL helpers. No React.
  - It ships TypeScript source with no build step (`exports` points to `src/index.ts`), so that the apps' Vite sees `import('tone')` and keeps it a lazy chunk.
  - It uses `@tonaljs/note` rather than the `@tonaljs/tonal` umbrella package, which is about 20 KB gz larger.
- The root `tsconfig.json` references the packages for editors only. App tsconfigs resolve the packages through `moduleResolution: bundler` and the packages' `exports.types`, not through project references.

### Apps

- **landing**: a gate page with four tiles that link to the subdomains, plus `/privacy`, which is the App Store privacy URL. There is no router: `App.tsx` picks the view from `window.location.pathname` through `routeFor()` (`src/lib/route.ts`), and the Worker's SPA fallback serves `index.html` for every path. Add pages by extending `routeFor`.
  - Fonts (Geist, Geist Mono, Newsreader) are self-hosted copies of musicians' fonts.
  - Breakpoint lanes: portrait phone; landscape phone `(min-width: 600px) and (max-height: 599px)`; desktop `(min-width: 768px) and (min-height: 600px)`.
- **scales**: a reference of 38 scales. React Router routes `/scales/:root` (for example `/scales/D-flat`) and `/collection/scales`.
  - Scales are grouped by chord-quality use case (`maj7`, `7`, `7alt`, `m7`, `m6`, `m7♭5`, `dim7`, `color`; PR #144). The data is in `src/features/scales/data/curated.ts` (`CURATED_SCALES`, `GROUPS`). The editorial fields stay in the app; music-core's `ScaleDefinition` is unchanged.
  - The score (abcjs) and the audio (Tone, Salamander piano samples in `public/audio/piano/`) are lazy-loaded.
  - Spec: `apps/scales/docs/specs/scales.md`.
- **chords**: a reference of 27 chords. Routes `/chords/:root` and `/collection/chords`, with no bare `/collection`.
  - Each row shows two symbols: the primary in modern lead-sheet style (`Cmaj7`, `Cm7♭5`) and, smaller, the alternate in traditional jazz style (`CΔ7`, `Cø7`). The alternate slot stays empty when the two are the same.
  - Rows are ordered by size (triads → 13ths), then by quality, under group headings (TRIADS / SIXTHS / SEVENTHS / NINTHS / EXTENDED / ALTERED).
  - Audio is `playChord(notes, 'arp-then-block')` and reuses scales' piano samples.
  - Spec: `apps/chords/docs/chords.md`.
- **metronome**: a single screen with no router. It was built for one problem: an iPhone into USB-C into RCA into a piano's aux input, where native metronomes drop the leading edge of each click.
  - The audio is raw Web Audio, not Tone: a 30 Hz sub-audible keep-alive, a 25 ms tick and 100 ms lookahead scheduler, a 400 ms warm-up, and a two-voice wood-block sound.
  - Wake Lock API and NoSleep.js both engage in the gesture. A banner detects embedded WKWebViews, where wake lock fails.
  - The design source of truth is `apps/metronome/docs/design_handoff_metronome/`; spec: `apps/metronome/docs/specs/metronome.md`.
  - `PatternEditor` takes N rows: v1 ships one, and a second row for polyrhythms is planned, so don't assume a single row.
  - On a small phone, Start sits in a sticky `<footer>` (PR #125); `tests/e2e/metronome-issue-105*.spec.ts` guards it.
  - The on-device keep-alive test (5 min at 120 BPM through the USB DAC) was still pending in June 2026.
- **musicians**: an explorer of jazz musicians and their collaborators. React Router v7: `/` → `/musicians` (home), `/musicians/:id` (detail, `:id` is the graph node id such as `wikidata:Q93341`), catch-all → `/musicians`. The "More about" sheet is the `#about` hash.
  - The app has its own design tokens and fonts in `src/index.css` (`--bg/--paper/--card/--accent`, Geist/Newsreader). It does not use the stone/amber tokens or `StickyHeader` of scales and chords. Dark mode is `data-theme="dark"` on `<html>`, and the theme key is `jazzlore:theme:v1`.
  - `src/lib/` holds pure domain types, mappers and builders.
  - Detail page:
    - Records are shown as a chronological discography: studio first, then non-compilation/live, then `release_year`, then title. Cover art is hotlinked from the Cover Art Archive (`/front-250`, `referrerPolicy="no-referrer"`). About 25% of records have no cover and get a typographic sleeve (`TypographicCover`). Each record has Apple-first listen icons.
    - Collaborator rows have Listen links that degrade over 3 tiers: a curated track (`CURATED ∪ LISTEN_EXTRAS` in `src/data/curated.ts`), then the artist URL from the populator, then a `<name> jazz` search.
    - The bottom sheets (`MoreAboutSheet`, `SharedRecordsSheet`) compose the `@jazzlore/ui` sheet hooks. Scroll lock prevents default on wheel and touchmove, because `position:fixed` makes the sticky header jump and `overflow:hidden` doesn't stop scrolling. Closing goes through `requestClose`, which defers the unmount so the sheet can animate out.
    - Desktop adds a d3-force graph panel, lazy-loaded and capped at 30 nodes. There is no graph on mobile.
  - An app-wide `ErrorBoundary` renders the calm `WakingState` error screen instead of a blank page.
  - Spec: `apps/musicians/docs/specs/musicians.md`; data schema: `apps/musicians/docs/FRONTEND.md` and `data-audit.md`.

### The musicians Worker (`apps/musicians/worker/`)

One Worker (`index.ts`) serves the static assets, `/api/*`, a dynamic `/sitemap.xml`, and SEO head injection. There is no Pages `functions/` directory.

- **Data access:** `aura.ts` calls Aura's HTTP Query API with `fetch` and Basic auth.
  - A request aborts after about 9 s and becomes `503 {status:"waking", retryAfter}`, which the frontend shows as its "waking up" state.
  - A transient fetch failure is retried once after 250 ms. An abort or an HTTP error is never retried.
  - Cypher lives in `cypher.ts`, is parameterized, and is checked read-only by `assertReadOnly`.
- **Endpoints**, with their edge cache TTLs:

  | Endpoint | TTL | Notes |
  |---|---|---|
  | `/api/musicians/curated` | 12 h | |
  | `/api/musicians/:id` | 1–2 h | Includes `sameEra` |
  | `/api/musicians/:id/graph` | 1–2 h | Reuses `detailCypher` |
  | `/api/musicians/by-ids?ids=` | 1–2 h | At most 20 ids; frontend batches must stay ≤ 20 |
  | `/api/musicians/search-index` | 6 h | The autosuggest corpus |
  | `/api/musicians/polished-ids` | 6 h | Random Jump pool |
  | `/api/musicians/:focusId/collaborators/:collabId/records` | 2 h | 100 rows plus `totalCount` |
  | `/api/health` | `no-store` | |

  Ids from the old MusicBrainz scheme resolve through `also_known_as_ids` to their wikidata node, and the detail page then replaces the URL with the canonical id.
- **Detail read-through cache** (`cache.ts`, PR #180): `/api/musicians/:id` GETs are stored in `caches.default` for 12 h under a synthetic key (`CACHE_KEY_ORIGIN`). It caches JSON only, never a non-200.
  - Why: the heavy detail reshape for high-degree musicians exceeded the free-tier CPU limit (Cloudflare Error 1102). The error page looked like "graph unreachable" because a 1102 body is not the Worker's waking envelope. See `apps/musicians/docs/graph-unreachable-findings.md`.
  - Deploys don't clear this cache. The `x-jazzlore-cache` header shows hit, miss or bypass.
- **SEO** (`og.ts`): on a document navigation (`Sec-Fetch-Dest: document` or `Accept: text/html`; a bare `curl` gets the plain shell), the Worker rewrites `<title>`, the description, OG and Twitter tags, canonical, and a schema.org Person/MusicGroup JSON-LD with `sameAs` links.
  - MusicGroup is chosen only when there is no birth or death date and the name contains a group keyword. `genre` appears only on MusicGroup.
  - Any Aura failure falls back to the untouched shell.
  - Body SSR and `schema:MusicAlbum` are deferred; see `apps/musicians/docs/seo-audit-findings.md`.
- **Explicit projections:** since #155, `detailCypher` projects explicit property maps for records and collaborators, so new graph properties must be added there and to the mapper.
- **Duplicates:** a structured warning (`duplicates.ts`) names suspected duplicate nodes for the populator. There is no deduplication in the BFF or the frontend.
- Workers Logs (`observability`) is on.

### Tooling and tests

- **Unit tests:** Vitest with jsdom and React Testing Library in every package.
  - Each `src/test/setup.ts` polyfills `localStorage`, because Node 26 with jsdom 29 doesn't expose it.
  - Each setup also registers jest-dom matchers explicitly with `expect.extend(matchers)`. The side-effect import can bind to a different Vitest instance in pnpm worktrees.
  - jsdom has no `matchMedia`, so hooks guard for it.
  - Vite and Vitest configs set `root`/`test.root` from `__dirname`.
- **E2E:** Playwright in `tests/e2e`, chromium and webkit.
  - The config starts every app's dev server, plus `vite preview` builds on 5183–5186 for the PWA specs (service workers are off in dev).
  - The BFF is mocked with fixtures (`musicians-bff-mock.ts`, `fixtures/`).
  - `musicians-joint-fix-acceptance.spec.ts` checks live production when `PREVIEW_BASE` is set.
  - `a11y.spec.ts` runs axe.
  - Playwright empties `test-results/` at the start of every run, so screenshots meant to last go under `docs/`.
- **Audits:** `tests/lighthouse-audit.mjs` (`pnpm lighthouse:audit`) drives system Chrome through `chrome-launcher`; the bundled-Chrome CLIs (`@axe-core/cli`, `pa11y`) don't work on this machine. `tests/musicians-bundle-budget.mjs` checks the initial chunk and that d3-force stays out of it.
- **`scripts/`:**
  - `test.sh` is the gate.
  - `generate-icons.mjs` (`pnpm icons`) turns the SVG masters in `assets/icons/<surface>/` into each app's favicon and PNGs.
  - `generate-widget-content.mjs` (`pnpm widget:content`) writes the iOS widget's bundled data into the jazzlore-ios repo.
  - `check-conflict-dupes.mjs` is an iCloud duplicate guard that is no longer needed.
- **CI:** GitHub Actions runs `pnpm lint` on every PR and push (`.github/workflows/lint.yml`), and `main` requires the `eslint` check (admins bypass it, so `land.sh` pushes go through). `keep-aura-warm.yml` pings `/api/health` every 2 days, but GitHub disabled it for inactivity around 2026-08-19.

## Data and state

- **Browser storage:** only through `@jazzlore/music-core` storage, which prefixes keys with `jazzlore:`.
  - Theme: `jazzlore:theme:v1`.
  - Chords collection: `jazzlore:chords:v1`, holding `{ rootNote, chordId, savedAt }`.
  - Metronome: `jazzlore:metronome:bpm`, `…:beats`, `…:pattern`, `…:mode`.
  - Each subdomain has its own `localStorage`, so theme and collections are not shared between apps. A combined collection is therefore deferred.
- **The musicians graph:** Neo4j Aura Free, database `d30e12cc`, read-only from this repo.
  - The only writer is the populator, a separate Python project at `~/Documents/JazzDBPopulator/` (`make publish-neo4j`).
  - A field missing in production means the populator hasn't published it.
  - Old MusicBrainz ids map to wikidata ids in its `data/id_aliases.jsonl`, always MusicBrainz → wikidata.
  - Curated listen tracks are in its `data/streaming_overrides.jsonl` and are mirrored in `apps/musicians/src/data/curated.ts`.
  - A publish changes BFF responses without a deploy, but the 12 h detail cache can delay that.
- **Credentials:** `NEO4J_URI/USERNAME/PASSWORD/DATABASE` are Cloudflare Worker variables in production, and live in `.dev.vars` at the repo root locally (git-ignored; `.dev.vars.example` is the template and needs the `!.dev.vars.example` line in `.gitignore`).
- **Images:** portraits come from Wikimedia Commons and covers from the Cover Art Archive. Attribution is rendered from the `*_license`/`*_attribution` fields.
- **The iOS widget's data** is generated at build time from the BFF by `pnpm widget:content`. The widget uses no network at runtime.

## External services

- **Cloudflare Workers**: deploys through the Workers Builds GitHub integration. Every push to `main` rebuilds all five Workers one after another; musicians finishes last, about 4–5 minutes after the push.
  - Build failures to know about:
    - **Clone failure:** "Failed: error occurred while fetching repository" is transient and never retried automatically.
    - **Stale build cache:** the build passes but the old bundle is deployed (hit on landing twice). The fix is the dashboard's Clear Cache, then Retry deploy.
    - **Name check:** wrangler 4.94+ fails when a config's `name` differs from the dashboard name. It also fails spuriously during Cloudflare outages.
  - A new app needs a one-time dashboard step: create the Worker project, pick its wrangler config, bind the domain. Until then its build never appears.
  - Free tier: 100k requests per day, shared by all apps, which is why one musicians page load makes one BFF call and autosuggest searches a cached corpus on the client. CPU per request is also limited (Error 1102).
- **Neo4j Aura Free**: it pauses after 3 idle days, and the first request then takes 20–40 s (the waking state).
  - The `mcp__neo4j__*` tools fail on this database (DatabaseNotFound, because they default to `neo4j`). Read live data through the BFF instead, for example `curl https://musicians.jazzlore.com/api/musicians/search-index`.
- **Apple Music and Spotify** (deep links only, no players):
  - The official artwork is vendored unmodified in `apps/musicians/public/brand-assets/`.
  - Apple artwork is never recoloured: light and dark use Apple's two official files, swapped with `[data-theme]`. Apple Music leads, placed left of or above Spotify (Apple Identity Guidelines §1.3).
  - The Spotify mark is recoloured through a CSS mask with `currentColor`, and no Spotify green is used.
  - A trademark line sits in the detail footer.
- **App Store:**
  - `packages/ui/src/appStoreLinks.ts` maps metronome/chords/scales to `{url, available}`, and all three are `available: true`. On iOS browsers the install sheet then shows Apple's "Download on the App Store" badge instead of the Add to Home Screen steps. Musicians isn't in the App Store, so it isn't listed.
  - Flipping `available` also breaks two assertion tests.
- **Capacitor iOS shell** (`winterized/jazzlore-ios`): each app ships as a frozen copy of `dist/` served from `capacitor://localhost`. Web deploys don't reach it; reaching iOS users takes `make <app>` there and a new App Store build.
  - Musicians' native shell calls the BFF at `https://musicians.jazzlore.com` because the shell has no `/api`. `CapacitorHttp` in the iOS config bypasses CORS. A 200 response with a non-object body is rejected.
  - The widget's tap deep link `jazzlore-musicians://musician/<id>` is routed by `src/components/DeepLinkHandler.tsx`.
  - Share links are re-based onto the web origin by `src/lib/shareUrl.ts`.
- **Google Search Console**: the domain property `sc-domain:jazzlore.com` has three sitemaps submitted: musicians (dynamic, about 30k URLs), and the static ones of chords and scales.

## Constraints

- **Quality bars:** Lighthouse performance ≥ 90 and accessibility ≥ 95, axe 0 violations in both themes, initial JS ≤ 100 KB gz.
  - **Known overrun:** the musicians initial chunk is 110.6 KB gz (measured 2026-10-09; production serves the same bundle). `scripts/test.sh` enforces a temporary 112 KB ceiling in `tests/musicians-bundle-budget.mjs` until a task brings it under 100 KB (see `docs/DECISIONS.md`).
  - On the musicians detail route, mobile performance was 84.5 after PR #165, still below the bar; #166 is the follow-up.
  - Measure detail routes on the live site and take the median of 3–5 runs. Long off-screen image lists saturate the connections under slow 4G and delay the LCP image, so they need `content-visibility:auto` with `contain-intrinsic-size`, `fetchpriority="high"` on the LCP image, and a `preconnect` to its origin (`apps/musicians/docs/detail-perf-findings.md`).
  - axe flags low-contrast text even when it is `aria-hidden`: make the foreground stronger rather than excluding the element.
- **iOS facts that no automated test catches:**
  - WebAudio plays through an "ambient" session that the mute switch silences. `primeAudio()` sets `navigator.audioSession.type = 'playback'` (iOS 16.4+), with a silent `<audio>` fallback for older versions.
  - Output latency of about 20–50 ms is an OS floor that JavaScript can't reduce (PR #44, reverted).
  - The keyboard appears on the first tap only if the input is always mounted, `.focus()` runs synchronously in the gesture, and the input is a sibling of the click target, not a child (`apps/metronome/src/features/ui/BpmHero.tsx`).
  - `vh` includes the URL bar, so use `dvh`.
  - Playwright has no safe-area insets. `tests/e2e/metronome-issue-105.spec.ts` shows how to inject them.
- **CSS and SVG pitfalls this codebase has hit:**
  - SVG paints in DOM order, so hover labels must render after all nodes. Use `data-active` from state rather than descendant `:hover` selectors.
  - `svgElement.className` is an object; use `getAttribute('class')`.
  - Tailwind 4 rewrites `@media` queries to range syntax in the built CSS.
  - Use `minmax(0, 1fr)`, not `1fr`, for equal grid columns.
  - `position: sticky` pins to the nearest scrolling ancestor.
  - CSS variables with the same name mean different things in different apps, so grep before adding one.
  - A backtick inside a CSS comment in a `.ts` template literal ends the literal.
  - Marks drawn at several sizes compute positions as fractions of width and height, not with a fixed `viewBox`.
- **Testing pitfalls:**
  - `vi.spyOn(console, 'warn')` misses warnings raised inside worker modules, so inject a logger instead (`warnOnDuplicates` in `worker/duplicates.ts`).
  - When real CSS loads in jsdom, the hidden variant of a dual-variant control drops out of the accessibility tree, so assert those through `container.querySelectorAll`.
- **Inferred:**
  - *(inferred)* `vitest.workspace.ts` lists only four packages and nothing in `package.json` uses it. Unit tests run per package through `pnpm -r run test:run`.
  - *(inferred)* `.github/workflows/lint.yml` uses Node 22. Local development uses Node 26 from nvm.
