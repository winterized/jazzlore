# Jazzlore — scales app memory

The first sub-site of the Jazzlore portfolio: a public, polished jazz scales reference. Live at <https://scales.jazzlore.com>. See `/CLAUDE.md` at the repo root for workspace-wide context and conventions.

## App-specific tech

- **Build:** Vite (config at `apps/scales/vite.config.ts`).
- **Routing:** React Router. Routes: `/scales/:root` (e.g. `/scales/D-flat`), `/collection/scales`. SPA fallback handled by Cloudflare's `not_found_handling: "single-page-application"`.
- **Music theory:** `@jazzlore/music-core` (re-exports `@tonaljs/note` helpers + domain logic).
- **Score rendering:** `abcjs`, lazy-imported inside `ScaleScore` to keep it out of the main bundle.
- **Piano keyboard:** `<PianoKeyboard>` from `@jazzlore/ui` — purely presentational SVG, takes pre-computed pitch classes.
- **Audio:** Tone.js via `@jazzlore/music-core/audio`, lazy-loaded. Salamander piano samples in `public/audio/piano/` (CC-BY, see LICENSE.md there).
- **Persistence:** `localStorage` via `@jazzlore/music-core/storage`. Never call `localStorage` directly — the storage module enforces the `jazzlore:` key prefix and is the seam if we ever swap for a backend.

## Sticky-header design (2026-05-15)

The page now uses `StickyHeader` from `@jazzlore/ui` (sticky translucent header, scroll-reactive title, inline root picker, scroll-spy chip row — one chip per scale family). The family-accordion `expanded` state is controlled: lifted to `ScalesPage`, passed into `ScaleList` via props (`expanded` + `onExpandedChange`). Clicking a chip expands that family (expand-only — never collapses via chip); the family's own accordion header still toggles freely. See `apps/scales/docs/specs/scales.md` → "Superseded by the sticky-header design" for the full rationale.

## Source structure (`apps/scales/src/`)

```
components/       App-specific components (kept in @jazzlore/ui if reusable)
features/         Feature-scoped folders (scales/, collection/, audio/)
lib/              App-specific helpers (most domain logic lives in @jazzlore/music-core)
pages/            Route components
styles/           App globals (print.css, theme.css)
test/setup.ts     vitest setup (jest-dom + localStorage polyfill for Node 26 + jsdom 29 + Vitest 4)
```

## Definition of done (per feature)

- [ ] Spec in `apps/scales/docs/specs/<feature>.md` up to date.
- [ ] Unit tests for domain logic, green; component tests where behavior matters.
- [ ] Renders correctly on mobile and desktop, light and dark themes.
- [ ] Keyboard accessible.
- [ ] No `console.log`, no `any`, no TODO without a linked issue.
- [ ] Lighthouse: perf > 90, a11y > 95.

## Learning goals (Aurélien)

This project is also a learning instrument. When there's tension between "ship fastest" and "learn modern practice", lean toward learn — and explain the tradeoff. Specifically hands-on experience with: spec-driven development with AI, TDD with AI, the Superpowers plugin workflow, Context7 for fresh library docs, Playwright MCP for self-validating UI changes, modern frontend defaults (Vite, TS strict, Tailwind, accessibility). Treat me as a senior engineer returning from a long break, not a beginner.

## Out of scope (this app)

- Authentication / user accounts.
- Server / database (a backend will come with the musicians sub-site, not this one).
- Native apps.
