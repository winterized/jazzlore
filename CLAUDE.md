# Jazzlore — workspace memory

## Portfolio

Jazzlore is a small public portfolio for jazz musicians and learners, by Aurélien Fontaine — an engineering director returning to hands-on coding. Built as a learning instrument for modern AI-augmented engineering.

Sub-sites under `jazzlore.com`:

- `scales.jazzlore.com` — jazz scales reference (this monorepo's first app, live)
- `chords.jazzlore.com` — planned
- `musicians.jazzlore.com` — planned, the only one that will need a backend (likely Cloudflare Pages Functions + Neo4j AuraDB HTTP Query API)

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
- **Lint / format:** ESLint flat config + Prettier at the workspace root, scanning all packages.
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

## Quality bars (per app)

- Lighthouse: performance ≥ 90, accessibility ≥ 95.
- axe-core: 0 violations on every public page in both light and dark themes.
- Bundle: initial JS ≤ 100 KB gz where reasonable; dynamic-import heavy chunks (notation, audio).

## Agent tooling

- **Superpowers** plugin — planning gate, TDD discipline, two-stage review (subagent-driven-development for monorepo-scale work).
- **Context7** plugin — fresh library docs. Always use Context7 when generating code that imports an external library (Tonal, abcjs, Tone.js, React Router, Tailwind, Vitest, Playwright, Storybook). Resolve the library id, fetch docs, then write code.
- **Playwright MCP** — drive a real browser for visual checks, a11y audits via axe-core injection, and ad-hoc validation during dev (not only for formal e2e).
