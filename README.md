# Jazzlore

A public web app for jazz musicians to explore scales, chords, and the relationships between them. The scales site is the first piece of the [Jazzlore](https://jazzlore.com) portfolio.

🌐 Live: _(coming soon at `scales.jazzlore.com`)_

## Features

- **Scales** — pick any root note, see every relevant jazz scale, hear it, save your collection, print sheets
- **Chords** _(coming, at `chords.jazzlore.com`)_ — pick any root, see voicings and inversions, hear them, save and print
- **Musicians** _(coming, at `musicians.jazzlore.com`)_ — explore a graph of jazz musicians and their collaborations over time

## Stack

React + TypeScript + Vite + Tailwind. Music theory via [Tonal](https://github.com/tonaljs/tonal), notation via [abcjs](https://www.abcjs.net/), audio via [Tone.js](https://tonejs.github.io/). Tested with Vitest and Playwright. Deployed on Cloudflare Pages.

## Local development

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Scripts

| Command            | What it does               |
| ------------------ | -------------------------- |
| `pnpm dev`         | Dev server with HMR        |
| `pnpm build`       | Production build           |
| `pnpm test`        | Unit tests (watch)         |
| `pnpm test:run`    | Unit tests (single run)    |
| `pnpm test:e2e`    | Playwright end-to-end      |
| `pnpm lint`        | ESLint                     |
| `pnpm format`      | Prettier                   |

## Status

In active development. Built as a hands-on exploration of AI-augmented software engineering in 2026.
