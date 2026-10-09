# Decision log

Dated decisions, newest last. Entries are only ever added: to reverse a decision, add a new entry that names the one it replaces.

Each entry has this shape:

    ## YYYY-MM-DD: short title
    Decision: what was decided.
    Why: the reason, and what was rejected.
    Source: docs/briefs/<file>.md, or "implementation choice" with the task's slug.

The entries up to 2026-06-16 were moved here on 2026-10-09 from the old `CLAUDE.md` files and the old Claude auto memory. Their dates are the original ones; their sources are the PRs or plans named.

## 2026-05-14: The design system never imports the domain layer
Decision: `packages/ui` takes pre-computed, primitive props (pitch classes, option lists, controlled state) and must not depend on `@jazzlore/music-core`, Tonal, Tone or abcjs. The package deps, an ESLint `no-restricted-imports` rule and review enforce it.
Why: the owner wants the design system reusable beyond Jazzlore, with boundaries enforced by the type of data crossing them. The one-way `ui → music-core` dependency was proposed for nicer component APIs and rejected. When in doubt about a package boundary, choose the stricter one.
Source: monorepo migration, PR #2.

## 2026-05-14: Chords show two notations at once
Decision: each chord row shows the modern lead-sheet symbol (`Cmaj7`, `Cm7♭5`) at full size and the traditional jazz symbol (`CΔ7`, `Cø7`) smaller underneath, with the second slot left empty when the two are the same. Display uses Unicode accidentals; ids stay ASCII (`m7b5`, `7s9`).
Why: both notations are in common use; an empty slot keeps the vertical rhythm.
Source: `apps/chords/docs/chords.md`.

## 2026-05-14: Chords v1 scope
Decision: out of scope for chords v1: inversions, voicings beyond root position, a custom chord builder, MIDI, sharing collections by URL, accounts and sync, and a combined `/collection` across scales and chords.
Why: the combined collection is blocked by per-subdomain `localStorage`; the rest is possible v1.1 work.
Source: `apps/chords/CLAUDE.md` (removed 2026-10-09).

## 2026-05-15: Shared sticky header for scales and chords
Decision: scales and chords use `StickyHeader` from `@jazzlore/ui`: a translucent sticky header with an inline root picker and a scroll-spy chip row, one chip per group. A chip only expands its group; the group header toggles.
Why: see the "Superseded by the sticky-header design" sections of `apps/scales/docs/specs/scales.md` and `apps/chords/docs/chords.md`.
Source: those specs.

## 2026-05-18: Musicians reads Aura through the HTTP Query API from one Worker
Decision: the musicians backend is a single Cloudflare Worker serving assets and `/api/*`, querying Neo4j Aura with `fetch` and the HTTP Query API. No `neo4j-driver` and no Pages `functions/` directory. Cypher is parameterized and read-only. One page load is one BFF call, and autosuggest searches a cached corpus on the client.
Why: Cloudflare's runtime doesn't support `neo4j-driver`, and the free tier's 100k requests a day are shared by every app.
Source: `apps/musicians/docs/plans/2026-05-18-musicians-v1.md`.

## 2026-05-18: Duplicate musicians are rendered as they are
Decision: no deduplication in the frontend or the mappers. The BFF logs a structured warning on suspected duplicates (shared wikidata, MusicBrainz or Discogs ids across nodes) for the populator's owner.
Why: duplicates are a data-quality problem owned by the populator, which is the only writer to Aura.
Source: `apps/musicians/CLAUDE.md` (removed 2026-10-09).

## 2026-05-18: Musicians v1 scope
Decision: out of scope for musicians v1: a path between two musicians, filters and facets, per-track listings, accounts and saved musicians (at most `localStorage`), audio previews or embedded players (deep links only), and a mobile graph (desktop only; on mobile the detail page is the product). Body SSR is deferred; SEO is served by head injection only.
Why: casual users tap rather than filter, and the data for tracks isn't in the graph.
Source: `apps/musicians/docs/specs/musicians.md`.

## 2026-05-18: Image attribution is a legal requirement
Decision: every rendered portrait or cover shows its attribution caption whenever any license or attribution field is non-empty. A missing portrait gets an explicit placeholder.
Why: Wikimedia Commons CC-BY and CC-BY-SA require attribution.
Source: `apps/musicians/docs/specs/musicians.md`.

## 2026-05-20: Metronome uses raw Web Audio, and its v1 scope
Decision: the metronome owns its AudioContext, with a sub-audible keep-alive, a lookahead scheduler and dual wake lock, instead of using Tone.js. Out of scope for v1: subdivisions, sound packs, setlists and presets, programmed tempo changes, random beat dropping and volume control. `PatternEditor` stays N-row so polyrhythms can come later.
Why: the app exists to keep an iPhone's USB DAC awake so the first click of each beat isn't dropped, which needs direct control of the audio graph.
Source: `apps/metronome/docs/plans/2026-05-20-v1-build.md`.

## 2026-05-25: Listen links degrade in three tiers
Decision: a collaborator's Listen link uses a curated track if there is one, then the artist URL supplied by the populator, then a `<name> jazz` search, separately for each service.
Why: most musicians have no curated track, and a search is better than no link.
Source: PR #92.

## 2026-05-26: PWA pattern for the practice tools
Decision: metronome, then scales and chords, are installable PWAs through vite-plugin-pwa: self-hosted fonts first, the static manifest kept (`manifest: false`), `injectRegister: 'script'` so registration stays off the audio gesture, and service workers off in dev, tested against `vite preview` builds.
Why: the metronome has to work offline at the piano; it was confirmed in airplane mode on an iPhone.
Source: PRs #100, #102, #103.

## 2026-05-27: The repository is public
Decision: `winterized/jazzlore` is public under MIT, with `NOTICE.md` for data and font attribution and `.dev.vars.example` as the only credentials template. Only the owner changes visibility, ownership or permissions.
Why: the project is a public portfolio.
Source: PRs #118, #119.

## 2026-05-28: No photos in autosuggest
Decision: autosuggest results show the editorial instrument figures, not portraits, and fetch no photos.
Why: an A/B of figures against text picked figures, and photo fetches on a transient surface cost too much on the free tier.
Source: PR #129.

## 2026-05-30: Scales grouped by chord quality
Decision: the 38 scales are grouped by the chord quality they serve (maj7, 7, 7alt, m7, m6, m7♭5, dim7, color) instead of by derivational family. Ionian became Major, Aeolian became Natural minor, and Bebop major became Major bebop. The grouping data stays in the app, not in music-core.
Why: players look for a scale from the chord in front of them.
Source: PR #144, `apps/scales/docs/specs/scales.md`.

## 2026-05-30: Lint is a required gate
Decision: `pnpm lint` is held at 0 errors and 0 warnings, unused `eslint-disable` directives are errors, and CI requires it on `main`. Prettier is not enforced.
Why: a red baseline hid new violations (#134).
Source: PR #141.

## 2026-06-02: Apple Music and Spotify branding
Decision: official artwork, vendored unmodified. Apple artwork is never recoloured, and Apple Music leads when shown next to Spotify. Spotify's mark is recoloured to match the design, with no green. A trademark line sits in the detail footer. No ℠ symbol is added.
Why: Apple's Identity Guidelines are checked in App Review; Spotify's are not. "Apple Music" never appears as body text, so a ℠ would either modify the artwork or be redundant.
Source: PRs #147, #148.

## 2026-06-03: Musicians PWA caches only the app shell
Decision: the musicians service worker precaches only the app shell, never `/api`. In the native iOS shell, the BFF is called at its absolute origin through `CapacitorHttp`.
Why: offline browsing of the graph is not a goal, and `capacitor://localhost` has no `/api`.
Source: PRs #151, #153, jazzlore-ios #5.

## 2026-06-07: The iOS widget bundles its data
Decision: the "Musician of the Day" widget ships its content and portraits in the app, generated at build time by `pnpm widget:content`. It uses no network at runtime and rotates through a fixed list of 39 musicians in sequence.
Why: it's simpler and more reliable than a widget that fetches.
Source: jazzlore-ios PR #8, PRs #157, #158.

## 2026-06-12: Records are a chronological discography
Decision: a musician's records are ordered studio-first, then non-compilation/live, then by release year, then by title. This replaced ordering by collaborator count.
Why: collaborator count rewarded ensemble size (Kind of Blue sank to #49), and no signal in the graph measures a record's importance. Putting masterpieces first would need editorial curation. Bake-off: `apps/musicians/docs/records-ordering-findings.md`.
Source: PR #162.

## 2026-06-12: Off-screen covers must not compete with the LCP image
Decision: record tiles use `content-visibility:auto`, the hero portrait gets `fetchpriority="high"`, and Wikimedia gets a `preconnect`. Detail routes are measured on the live site, median of 3–5 runs.
Why: on slow 4G the off-screen covers saturated the connections and delayed the hero image. A local measurement had wrongly called them harmless. Mobile performance went from 72 to 84.5; #166 tracks the rest.
Source: PR #165, `apps/musicians/docs/detail-perf-findings.md`.

## 2026-06-15: App Store badges on chords and scales
Decision: chords and scales join metronome in showing the App Store badge in the install sheet on iOS browsers. Musicians stays out until it is in the App Store.
Why: both apps passed App Review and their listings were confirmed live.
Source: PR #174.

## 2026-06-16: Cache the musicians detail response for 12 hours
Decision: `/api/musicians/:id` reads through `caches.default` with a 12 h TTL under a synthetic key, storing only successful JSON. Transient Aura fetch failures are retried once.
Why: the reshape for high-degree musicians exceeded the free-tier CPU limit (Error 1102), which showed as "graph unreachable". 12 h is the middle of the 6–24 h range that was considered: longer means fewer cold misses but staler data.
Source: PR #180, `apps/musicians/docs/graph-unreachable-findings.md`.

## 2026-10-09: Work runs as reviewed tasks
Decision: every change is a task: a brief, an approved plan, its own worktree, a review by the `reviewer` subagent, then `.claude/hooks/land.sh`, which re-runs `scripts/test.sh` and pushes to `main`. Sessions can't push. This replaces the earlier PR-based flow and its tooling (oh-my-claudecode, Superpowers). One root `CLAUDE.md` replaces the per-app ones, whose facts moved into this file and `docs/ARCHITECTURE.md`.
Why: the owner's workflow across repositories, installed from `~/claude-repo-kit`.
Source: implementation choice, workflow setup.

## 2026-10-09: The repository lives outside iCloud
Decision: the working checkout moved from `~/Documents/jazzlore` (iCloud-synced) to `~/Developer/jazzlore`. The "run `pnpm check:dupes` before `make <app>`" rule (#137) is dropped; the script stays.
Why: iCloud created conflict copies in build output, inside `.git`, and of every worktree.
Source: implementation choice, workflow setup.

## 2026-10-09: What scripts/test.sh covers
Decision: the gate runs install, ESLint, typecheck, build, unit tests, script tests and the musicians bundle budget. The Playwright suite stays out of the gate, because it uses fixed ports. `scripts/test.sh e2e` runs it behind a machine-wide lock, with `CI=1` so it never reuses another checkout's server.
Why: the owner chose this so parallel worktrees can't test each other's servers.
Source: implementation choice, workflow setup (owner's decision).

## 2026-10-09: Temporary 112 KB ceiling on the musicians bundle budget
Decision: the quality bar stays 100 KB gzipped of initial JS. The musicians initial chunk is already 110.6 KB, and production serves the same bundle, so the gate's budget check (`tests/musicians-bundle-budget.mjs`) holds a temporary 112 KB ceiling that stops further growth. The task that brings the chunk under 100 KB also sets the limit back to 100.
Why: at 100 KB the gate would have refused every task. Dropping the check would let the bundle keep growing.
Source: implementation choice, workflow setup (owner's decision).

## 2026-10-09: Review policy for tasks
Decision: a task gets at most two reviews. Nothing lands while a blocker or major finding is open or disputed; only the owner can override that, by hand. Every finding that was not fixed is listed in the session's final message, minor ones included. Review reports are kept in `.claude/reviews/` in the main checkout, git-ignored, and deleted after 30 days.
Why: runs are unattended, so the check before a merge must not depend on the implementing session's own account of its work, and an unresolved finding has to reach the owner.
Source: docs/briefs/2026-10-09-record-review-policy.md.
