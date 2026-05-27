# Jazzlore

A small public portfolio of jazz tools for musicians and learners, by
[Aurélien Fontaine](https://github.com/winterized). Built as a learning
instrument for modern AI-augmented engineering.

🌐 Live at [**jazzlore.com**](https://jazzlore.com)

## The four apps

| App                                                         | What it does                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **[scales.jazzlore.com](https://scales.jazzlore.com)**      | Pick any root, see every relevant jazz scale, hear it, save your collection, print it. |
| **[chords.jazzlore.com](https://chords.jazzlore.com)**      | Pick any root, see voicings and inversions, hear them, save and print.                 |
| **[musicians.jazzlore.com](https://musicians.jazzlore.com)** | Explore a graph of jazz musicians and their collaborations over time.                 |
| **[metronome.jazzlore.com](https://metronome.jazzlore.com)** | A tactile, public-domain metronome built on raw Web Audio.                            |

All four are mobile-first, public-ready, install-as-PWA where useful, and
share a small design system and theme toggle.

## Stack

A pnpm-workspace monorepo, TypeScript strict everywhere.

- **Apps** — React 19 + TypeScript + Vite + Tailwind v4
- **Music theory** — [Tonal](https://github.com/tonaljs/tonal)
- **Notation** — [abcjs](https://www.abcjs.net/)
- **Audio** — [Tone.js](https://tonejs.github.io/) (scales/chords), raw Web Audio (metronome)
- **Musicians graph** — Neo4j Aura, queried via the HTTP Query API from a
  Cloudflare Worker BFF
- **Tests** — Vitest (unit), Playwright + axe-core (e2e + a11y)
- **Hosting** — Cloudflare Workers Static Assets (one Worker per app)

## Layout

```
jazzlore/
├── apps/
│   ├── landing/          jazzlore.com gate
│   ├── scales/           scales.jazzlore.com
│   ├── chords/           chords.jazzlore.com
│   ├── musicians/        musicians.jazzlore.com (BFF + Aura)
│   └── metronome/        metronome.jazzlore.com
├── packages/
│   ├── ui/               shared presentational components (ThemeToggle, etc.)
│   └── music-core/       music theory, audio, storage, theme persistence
├── tests/e2e/            Playwright, app-agnostic location
└── wrangler.*.jsonc      one per deployable app
```

Per-app `CLAUDE.md` files document app-specific conventions; the root
[`CLAUDE.md`](./CLAUDE.md) captures workspace-wide rules.

## Local development

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm dev                  # landing (jazzlore.com)
pnpm dev:scales           # scales.jazzlore.com
pnpm dev:chords           # chords.jazzlore.com
pnpm dev:musicians        # musicians.jazzlore.com (frontend; BFF mocked by fixtures)
pnpm dev:metronome        # metronome.jazzlore.com
```

The musicians BFF talks to a live Neo4j Aura instance. To run it end-to-end
locally against your own Aura, copy `.dev.vars.example` to `.dev.vars` and
fill in `NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD / NEO4J_DATABASE`. Without
those, the BFF returns its frozen "waking" 503 and the frontend renders the
waking-state placeholder — which is itself a useful UI to develop against.

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | Dev server (landing) with HMR             |
| `pnpm dev:<app>`   | Dev server for a specific app             |
| `pnpm build`       | Production build of every app             |
| `pnpm typecheck`   | Recursive `tsc --noEmit` across all packages |
| `pnpm test:run`    | Recursive unit tests (Vitest)             |
| `pnpm test:e2e`    | Playwright e2e at the workspace root      |
| `pnpm lint`        | ESLint                                    |
| `pnpm format`      | Prettier                                  |
| `pnpm storybook`   | Storybook for `@jazzlore/ui`              |

## Status

Active. ~50 PRs in the first three weeks; the four apps are live; PWA is
shipped on metronome, chords, and scales.

## About this codebase

Jazzlore is also a personal learning instrument. I'm an engineering director
returning to hands-on coding after a long break, and I wanted a real, public,
polished build to exercise modern practice — TDD with visual fixes, design-
system purity, AI-paired development, accessible mobile-first UI, edge-deployed
backends — without inventing requirements I didn't actually need.

The implementation work was paired with Anthropic's Claude (via Claude Code).
Commits carry a `Co-Authored-By` trailer where Claude contributed substantively;
the architecture, design decisions, scope calls, and the personal voice are
mine. The `CLAUDE.md` files at the root and per-app are essentially the
project's playbook — written for Claude, but readable as plain documentation
of how the codebase wants to be touched.

## Data sources and credits

The musicians app draws on **MusicBrainz**, **Wikidata**, **Wikimedia Commons**
(for portraits), and small derived facts from **Discogs**. The data pipeline
that ingests and reconciles those sources lives in a separate, private
repository and is not part of this release. See [`NOTICE.md`](./NOTICE.md) for
full attribution, licenses, and image-attribution policy.

## License

[MIT](./LICENSE). See also [`NOTICE.md`](./NOTICE.md) for third-party data and
font licenses.
