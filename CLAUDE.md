# Jazzlore — workspace memory

## Portfolio

Jazzlore is a small public portfolio for jazz musicians and learners, by Aurélien Fontaine — an engineering director returning to hands-on coding. Built as a learning instrument for modern AI-augmented engineering.

Sub-sites under `jazzlore.com`:

- `jazzlore.com` — root-domain gate page introducing all four tools (PR #97/#98/#99 shipped 2026-05-25); single static React+Vite app at `apps/landing/`, deploys via `wrangler.jsonc` to the `jazzlore-landing` Worker; uses the shared `<ThemeToggle>` from `@jazzlore/ui`. Privacy policy page at `jazzlore.com/privacy` (the App Store privacy URL for the iOS apps; contact = GitHub issues) shipped 2026-05-29 via PR #138 — no client router, `App.tsx` picks the view from `window.location.pathname` via `routeFor()` (`src/lib/route.ts`) on the Worker's SPA fallback; same PR added a global `:focus-visible` ring to the landing app
- `scales.jazzlore.com` — jazz scales reference (the monorepo's first app, live); deploys via `wrangler.scales.jsonc` (renamed from `wrangler.jsonc` when landing took the root config); collection-page safe-area insets shipped 2026-05-29 via PR #133 (#131); print toolbar hidden in the native shell via PR #136 (#135); chord-quality re-grouping shipped 2026-05-30 via PR #144 — the 38 scales now group by use case (maj7/7/7alt/m7/m6/m7♭5/dim7/color) instead of derivational family, each card gains a `description · theoryTag` line, and Ionian→Major / Aeolian→Natural minor / Bebop major→Major bebop renamed (see `apps/scales/docs/specs/scales.md` → "Chord-quality regrouping")
- `chords.jazzlore.com` — live (own Cloudflare Worker `jazzlore-chords` via `wrangler.chords.jsonc`; reuses scales' Salamander piano samples via lazy fetch; PWA pilot shipped 2026-05-26 via PR #103; collection-page safe-area insets shipped 2026-05-29 via PR #133 (#131); print toolbar hidden in the native shell via PR #136 (#135))
- `musicians.jazzlore.com` — live (Cloudflare Worker BFF over Neo4j AuraDB HTTP Query API; v1 design-fidelity overhaul 2026-05-20; search polish + journey landing pages + `/api/musicians/by-ids` batch endpoint + detail-page collaborator portraits + ranking fix shipped 2026-05-21; Wave 1 polish from audit + quality critique shipped 2026-05-22: search ranker (canonical preference + curated boost + dedup), Unicode-letter monogram filter, home-grid 4-col + equal-width tracks via `minmax(0, 1fr)`, real `<a href>` on orbit/connrow/era tiles, era-peer portraits, desktop force-graph capped at top-30, `/api/musicians/polished-ids` for Random Jump; Wave 2a editorial no-photo figures (FIG_LIB / figKey / NoPhotoMark via `Duo3 inst`) shipped 2026-05-23, B/Open redraw shipped same day; era-strip living-musicians fix 2026-05-24 (peersByEraCypher coalesces NULL end-year to `$currentYear`); graph polish (names on demand + family-coloured nodes) shipped 2026-05-24; Wave 3 / Tier 1 curated Listen deep-links shipped 2026-05-25; detail-page alias resolution & URL canonicalization shipped 2026-05-25 (`detailCypher` widens MATCH on `also_known_as_ids`; `MusicianPage` `useNavigate({replace:true})` to canonical); 3-tier Listen graceful degradation shipped 2026-05-25 (track via `CURATED ∪ LISTEN_EXTRAS` → artist via `links.spotifyArtistUrl|appleArtistUrl` populator-supplied → disambiguated `<name> jazz` search; per-service cascade; populator shipped the `streaming_ids.jsonl` Aura load same day); 2026-05-26/27 stale-state + drawer bundle: canonical-id ricochet fix (PR #108 — `useBffResource` resets to loading at render-time so the canonical-id `useEffect` never sees stale `state.data.id` after a collaborator click), "+N more" shared-records drawer (PR #113 — new lazy endpoint `/api/musicians/:focusId/collaborators/:collabId/records` with alias resolution on both sides, 100-row slice + true `totalCount`, leader-precedence `primaryArtist` via new `mapSharedRecord` helper; responsive bottom-drawer / desktop modal with focus trap), swipe-down dismiss + drop-cap-leak fix (PR #114 — drag-handle gesture gated to chrome touches not the scrollable list, MoreAboutSheet 46px drop-cap canceled for the records sheet), desktop-graph label paint-order fix (PR #116 — two-pass render so peripheral labels paint above all node circles; React-state `data-active="true"` replaces the broken `.mu-gnode:hover .mu-gnode-label` descendant-combinator); autosuggest no-photo instrument figures shipped 2026-05-28 (PR #129 — editorial figures replace autosuggest monograms, NO photo fetch given the free-tier cost on a transient surface; chosen from a figures-vs-text A/B; figure CSS de-scoped from `.mu3` so the rules reach the body-portalled listbox), `useSwipeDownDismiss` extracted to `@jazzlore/ui` for both sheets (PR #127); Apple Music + Spotify brand compliance shipped 2026-06-02 via PR #147 — official "Listen on Apple Music" badge + per-collaborator official Apple Music / Spotify icons (theme-swapped black/white, Apple artwork NEVER recoloured per its Identity Guidelines — App-Review-gated), the primary Spotify button keeps its amber styling but swaps to the official mark via CSS mask + `currentColor` (no green; pragmatic Spotify treatment), trademark line in the detail footer; official artwork vendored unmodified at `apps/musicians/public/brand-assets/` — see `DetailIdentity.tsx` + `ConnRow.tsx` + `components.css`, `apps/musicians/docs/specs/musicians.md` "Listen-button branding", and the brand-compliance project memory; brand-audit follow-up shipped 2026-06-02 via PR #148 — Apple Music now leads per Identity Guidelines §1.3 (badge LEFT of Spotify in the `.listen` row, icon ABOVE Spotify in the `.conn-act` column; pure JSX-order swaps + DOM-order guards), and ConnRow per-collaborator icons gained the tier-2 direct-artist-URL cascade (`Collaborator`/`mapCollaborator` now carry `spotifyArtistUrl`/`appleArtistUrl` from the existing `c{.*}` projection, no Cypher change); deliberately NO ℠ service-mark added — watch-item only; the post-deploy acceptance gate's 8 failures were all pre-existing/unrelated → issue #149)
- `metronome.jazzlore.com` — live (raw Web Audio engine, no backend; v1 shipped 2026-05-21; PWA pilot shipped 2026-05-26 via PR #100 — vite-plugin-pwa + self-host fonts, user-confirmed on-device offline in iPhone airplane mode same day; iOS safe-area-top via PR #104 (2026-05-27); Start-clipped-on-small-phones fix for issue #105 via PR #125 (2026-05-27) — sticky `<footer>` (`.start-footer` rule + bg-soft surface + `--shadow-color` drop shadow + 28px fade-gradient affordance) pinned to viewport bottom across mobile, browser + standalone unified, 5-device Playwright harness as permanent regression check with faithful safe-area shim calibrated against on-device Pro Max; audio keep-alive USB-C → RCA → Kawai on-device test still pending)

The public apps are also wrapped as **native iOS apps via Capacitor** (separate repo `winterized/jazzlore-ios`), each bundling a frozen snapshot of the web build served from `capacitor://localhost` — no auto-update, so reaching iOS users needs a native rebuild (`make <app>`) + a new App Store build. Detect the native shell with `window.Capacitor?.isNativePlatform?.()` (canonical: `packages/ui/src/isNativeApp.ts` → `isNativeApp`, re-exported from `@jazzlore/ui`); a Capacitor WKWebView matches neither `display-mode: standalone` nor `navigator.standalone`. The shared PWA install button hides in the native shell (and when standalone) — shipped 2026-05-29 via PR #132 (#130), covering Metronome / Chords / Scales from `@jazzlore/ui`. Each app's `main.tsx` also calls `hideNativeSplashAfterMount()` (`@jazzlore/ui`, gated on `isNativeApp` so it's a no-op in the browser) to dismiss the iOS launch splash after mount — shipped 2026-05-30 via PR #145; the native splash assets/config live in the iOS repo.

**iCloud build-output hazard (#137):** the working tree lives under `~/Documents`, which is iCloud-synced ("Desktop & Documents"), so iCloud spawns `"<name> 2.ext"` conflict-duplicate copies in build output (`apps/*/dist`). Because `make <app>` copies `dist/` verbatim, that junk would bundle into the `.ipa`. **Run `pnpm check:dupes` before every `make <app>`** (guard: `scripts/check-conflict-dupes.mjs`, exits non-zero listing offenders); if it flags anything, clean-rebuild the affected app (`rm -rf apps/<app>/dist && pnpm build:<app>`) — `dist` is gitignored, so these never reach git; Vite _does_ empty `outDir`, iCloud just re-creates the copies during sync. Relocating the tree out of iCloud (the true root-cause fix) was deliberately deferred — tracked separately. First cleaned for chords 2026-05-30 (#137).

Every public-facing app must feel public-ready from v1: clean, fast, accessible, mobile-friendly, no rough edges.

## Workspace layout

```
jazzlore/
├── apps/                 # one directory per deployable site
│   └── scales/           # see apps/scales/CLAUDE.md for app-specific details
├── packages/             # cross-cutting libraries
│   ├── ui/               # React design system, purely presentational
│   └── music-core/       # music theory, audio, storage — no React
├── tests/e2e/            # Playwright, app-agnostic location
└── (root configs: tsconfig.base.json, eslint, prettier, wrangler, playwright)
```

Per-app `CLAUDE.md` files take precedence over this one for that app's conventions.

## Shared tooling

- **Package manager:** pnpm 11 (`packageManager` field) + workspaces (`pnpm-workspace.yaml`)
- **Language:** TypeScript 6 strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`. Shared compiler options in `tsconfig.base.json`.
- **Testing:** Vitest 4 + React Testing Library per package; Playwright 1.60 for e2e at the workspace root.
- **Lint / format:** ESLint flat config + Prettier at the workspace root, scanning all packages. `pnpm lint` is **green (0/0) and a required CI gate** — `.github/workflows/lint.yml` runs it on every PR + push (Node 22; the `eslint` check is a required status check on `main`), and stale `eslint-disable` directives are errors (`reportUnusedDisableDirectives`). Keep it green; don't merge red. Prettier is **not** enforced (many files are unformatted on `main`) — don't reformat unrelated files in a PR.
- **Styling:** Tailwind CSS 4 (CSS-first config, no JS config file). Each app imports `tailwindcss` and adds `@source` for any `packages/*` whose classes it uses.
- **Deployment:** Cloudflare Workers Static Assets via `wrangler.jsonc` at the repo root (single project covering this monorepo's first deployed app). `not_found_handling: "single-page-application"` for React Router. Auto-deploy on push to `main` via Cloudflare's GitHub integration.

## Boundary rules between packages

- **`packages/ui` is purely presentational.** No imports from `@jazzlore/music-core`. Components accept pre-computed data via props (pitch classes, formatted labels, controlled state). Enforced by an eslint `no-restricted-imports` rule and by NOT listing react in music-core's deps.
- **`packages/music-core` has no React.** Pure music theory, audio engine, storage abstraction, theme persistence. Reusable across apps and (eventually) outside Jazzlore.
- **Apps integrate both.** They own the conversion between domain types and UI props (build `RootOption[]`, compute `scalePcs`, wrap theme persistence in a small `useTheme()` hook, etc.).

## Top-level commands

All scripts delegate to workspaces via `pnpm -F`:

- `pnpm dev` — start the scales app dev server
- `pnpm build` — production build of all apps
- `pnpm test:run` — recursive unit tests across all packages
- `pnpm test:e2e` — Playwright e2e at the workspace root
- `pnpm storybook` — Storybook for `@jazzlore/ui`
- `pnpm lint`, `pnpm format` — workspace-wide

## Conventions (repo-wide)

1. **TDD by default.** Domain logic and pure helpers get a failing test first. UI is tested via React Testing Library where behavior is worth asserting. Visual fixes deserve tests too (DOM order, nav links, CSS scope) — extract a pure helper when behavior is buried in a component.
2. **Read the spec first.** Each app keeps specs under `apps/<app>/docs/specs/`. Update the spec before guessing.
3. **No `any`.** Use `unknown` and narrow.
4. **Small files.** Components under ~150 lines; split when growing.
5. **Domain logic stays out of components.** Components call functions from `@jazzlore/music-core` or app-level logic modules — never reach for Tonal/Tone/abcjs directly.
6. **Accessibility is not optional.** Keyboard navigation, semantic HTML, ARIA, color contrast ≥ WCAG AA.
7. **Mobile-first.** Tailwind breakpoints up from default → `md:` → `lg:`.
8. **Conventional commits** with the trailer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
9. **iOS audio:** any control that plays sound MUST call `primeAudio()` from `@jazzlore/music-core` as the first synchronous statement of its click handler (before any `await`/`setState`). It promotes the iOS media session (`navigator.audioSession`, with a pre-16.4 silent-`<audio>` fallback) and unlocks the AudioContext in the gesture. Skipping it makes audio silent on iPhone — and this is **not catchable by CI/headless**; only an on-device iOS test proves audio works.
10. **Text inputs ≥16px.** Any focusable `<input>`/`<textarea>` uses `text-[16px]` (or larger) — a smaller font makes iOS Safari auto-zoom on focus, shifting the viewport. Add `autoCorrect`/`autoCapitalize="off"` + `spellCheck={false}` (+ `inputMode`) for search/code-style fields.
11. **Dual-variant CSS-gated controls → test with `getAllBy`/`within`.** The a11y pattern here mounts both responsive variants and hides one via Tailwind (`hidden`/`sm:` — e.g. the dual root pickers, the mobile-icon vs desktop-text collection link). jsdom doesn't evaluate those media classes, so such an element appears **twice** in unit tests: never `getBy*` it (throws on multiple) — use `getAllBy*` (assert each) or scope with `within(...)`. Real-browser e2e is unaffected.

## Quality bars (per app)

- Lighthouse: performance ≥ 90, accessibility ≥ 95.
- axe-core: 0 violations on every public page in both light and dark themes.
- Bundle: initial JS ≤ 100 KB gz where reasonable; dynamic-import heavy chunks (notation, audio).

## Agent tooling

- **Superpowers** plugin — planning gate, TDD discipline, two-stage review (subagent-driven-development for monorepo-scale work).
- **Context7** plugin — fresh library docs. Always use Context7 when generating code that imports an external library (Tonal, abcjs, Tone.js, React Router, Tailwind, Vitest, Playwright, Storybook). Resolve the library id, fetch docs, then write code.
- **Playwright MCP** — drive a real browser for visual checks, a11y audits via axe-core injection, and ad-hoc validation during dev (not only for formal e2e).
