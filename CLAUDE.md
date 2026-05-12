# Jazzlore — Claude Code project memory

## Project context

A public, polished web app for jazz musicians and learners to explore scales and chords. Built as a hands-on learning exercise in modern AI-augmented software engineering by Aurélien Fontaine, an engineering director returning to hands-on coding after several years.

The project is called **Jazzlore**. It is the first site in a small portfolio under `jazzlore.com` (this site lives at `scales.jazzlore.com`, with sibling sites `chords.jazzlore.com` and `musicians.jazzlore.com` planned).

The site must feel public-ready from v1: clean design, fast, accessible, mobile-friendly, no rough edges.

## Tech stack

- **Build**: Vite
- **Framework**: React 18 + TypeScript (strict mode)
- **Package manager**: pnpm
- **Music theory**: Tonal (`@tonaljs/tonal`)
- **Score rendering**: abcjs
- **Piano keyboard rendering**: custom SVG component (no dependency) — small, focused, fully testable
- **Audio**: Tone.js
- **Styling**: Tailwind CSS
- **Persistence**: `localStorage` (wrapped behind a `storage` module so we can swap for Supabase later)
- **Routing**: React Router
- **Testing**: Vitest + React Testing Library + Playwright for e2e
- **Linting / formatting**: ESLint + Prettier
- **Deployment**: Cloudflare Pages (connected to GitHub `main`). Part of the Jazzlore portfolio. No backend needed for this project — pure static + localStorage. The sibling `musicians.jazzlore.com` project will use Cloudflare Pages Functions + Neo4j AuraDB's HTTP Query API.

## Agent tooling (installed in Claude Code)

- **Superpowers** plugin — planning gate, TDD discipline, two-stage review
- **Context7** plugin — fresh library docs injected on demand (Tonal, abcjs, Tone.js, React Router)
Always use Context7 when generating code that imports an external library (Tonal, abcjs, Tone.js, React Router, Tailwind, Vitest, Playwright) — resolve the library id, fetch the docs, then write the code.
- **Playwright MCP server** — lets Claude drive a real browser to validate UI changes and run e2e tests itself
- **Claude in Chrome** — Chrome extension for driving an authenticated browser session, useful when poking at deployed previews

## Commands

- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm test` — unit tests (vitest, watch mode)
- `pnpm test:run` — single test run
- `pnpm test:e2e` — Playwright end-to-end
- `pnpm lint` — ESLint
- `pnpm format` — Prettier

## Project structure

```
src/
  components/       Reusable UI components
  features/         Feature-scoped folders (scales/, chords/, ...)
  lib/              Domain logic (music theory wrappers, storage)
  pages/            Route components
  styles/           Tailwind + globals
tests/
  e2e/              Playwright
docs/
  specs/            One spec per feature, written before the code
```

## Conventions

1. **TDD by default.** Domain logic (anything in `lib/` or `features/*/logic/`) gets a failing test first. UI is tested via React Testing Library where there is behavior worth asserting.
2. **Read the spec first.** Every feature has a doc in `docs/specs/`. Before coding, re-read it. If the spec doesn't answer the question, update the spec — don't guess.
3. **No `any`.** TypeScript strict. Use `unknown` and narrow.
4. **Small files.** Components < 150 lines; if it grows, split.
5. **Domain logic stays out of components.** Components call functions from `lib/` or `features/*/logic/`. Never import Tonal directly in a component.
6. **Storage abstraction.** All persistence goes through `lib/storage.ts`. Never call `localStorage` directly elsewhere — this is how we will swap for Supabase cleanly.
7. **Accessibility is not optional.** Keyboard navigation, semantic HTML, proper ARIA labels, color contrast ≥ WCAG AA.
8. **Mobile-first.** Tailwind breakpoints up from default (mobile) → `md:` → `lg:`.
9. **Commits.** Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).

## Definition of done (per feature)

- [ ] Spec in `docs/specs/<feature>.md` is up to date
- [ ] Unit tests for domain logic, green
- [ ] Component renders correctly on mobile and desktop
- [ ] Keyboard accessible
- [ ] No `console.log`, no `any`, no TODO without a linked issue
- [ ] Lighthouse: performance > 90, accessibility > 95

## Learning goals (Aurélien)

This project is *also* a learning instrument. When there is a tension between "ship fastest" and "learn modern practice," lean toward learn — but explain the tradeoff. Specifically I want hands-on experience with:

- Spec-driven development with AI
- TDD with AI (red-green-refactor loop)
- The Superpowers plugin workflow (planning gate, review gate)
- Context7 for fresh library docs
- Playwright MCP for self-validating UI changes
- Modern frontend defaults (Vite, TS strict, Tailwind, accessibility)

When you propose something, briefly note *why* — what tradeoff you made and what the alternative would have been. Treat me as a senior engineer returning from a long break, not a beginner.

## Out of scope (for now)

- Authentication / user accounts
- Server / database (will come with Supabase later)
- The musicians sub-site (separate project, will live at `musicians.jazzlore.com`)
- Native apps
