# Notice — third-party data and credits

Jazzlore is MIT-licensed code (see `LICENSE`). The apps display data from
several public sources, each under its own terms. This file collects the
attributions and license posture for what the apps redistribute or render.

## Data sources

### MusicBrainz

The musicians app's underlying graph (artists, recordings, collaborations) is
seeded in part from the [MusicBrainz](https://musicbrainz.org/) database.
MusicBrainz core data is released under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public
domain dedication). Identifiers shaped `musicbrainz:<uuid>` originate here.

Attribution: *Data courtesy of [MusicBrainz](https://musicbrainz.org/), made
available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/)
where applicable and CC0 otherwise.*

### Wikidata

Most canonical musician identifiers in the musicians graph (`wikidata:Q…`) and
several derived facts come from [Wikidata](https://www.wikidata.org/), released
under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

Attribution: *Data courtesy of [Wikidata](https://www.wikidata.org/) contributors,
released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).*

### Wikimedia Commons (images)

Musician portraits and album/record cover art are linked or sourced from
[Wikimedia Commons](https://commons.wikimedia.org/). Individual files carry
their own licenses — typically [CC BY](https://creativecommons.org/licenses/by/4.0/),
[CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/), or public domain.

The musicians app renders an attribution caption next to every image whose
upstream license requires one — author, license, and source link are shown
inline. This is a non-negotiable spec requirement, not a polish item; see
`apps/musicians/CLAUDE.md` for the rule and `apps/musicians/worker/cypher.ts`
for the fields driving it.

### Discogs

A small number of identifiers and supplementary fields (where present in the
graph) trace to [Discogs](https://www.discogs.com/) — both database fields and
images are subject to [Discogs' license terms](https://support.discogs.com/hc/en-us/articles/360009334593).
This repository does not redistribute Discogs bulk data; the frontend renders
small derived facts only. The data pipeline that ingests Discogs lives in a
separate, private repository and is not part of this open-source release.

### Streaming deep-links (Spotify / Apple Music)

The "Listen" feature deep-links to Spotify and Apple Music search and entity
URLs. No audio is hosted, downloaded, or redistributed; the app only navigates
the user out to those services. Spotify and Apple Music brand marks belong to
their respective owners.

## Software dependencies

Runtime and tooling are listed in the various `package.json` files. Notable
dependencies retain their original licenses (mostly MIT / BSD / Apache-2.0).
Among them:

- [React](https://react.dev/) — MIT
- [Vite](https://vite.dev/) — MIT
- [React Router](https://reactrouter.com/) — MIT
- [Tailwind CSS](https://tailwindcss.com/) — MIT
- [Tonal](https://github.com/tonaljs/tonal) — MIT (music theory)
- [abcjs](https://www.abcjs.net/) — MIT (music notation)
- [Tone.js](https://tonejs.github.io/) — MIT (Web Audio)
- [d3-force](https://github.com/d3/d3-force) — ISC (graph layout)
- [@cloudflare/workers-types](https://github.com/cloudflare/workerd) — Apache-2.0 / MIT
- [Vitest](https://vitest.dev/) — MIT
- [Playwright](https://playwright.dev/) — Apache-2.0

This list is non-exhaustive. The authoritative source is each package's own
license, as carried by `pnpm install` into `node_modules/<pkg>/LICENSE`.

## Fonts

Jazzlore self-hosts the following typefaces under their original licenses:

- **Geist** and **Geist Mono** — [SIL Open Font License 1.1](https://openfontlicense.org/),
  © Vercel.
- **Newsreader** — [SIL Open Font License 1.1](https://openfontlicense.org/),
  © Production Type.

Font files are bundled with the apps under those terms.

## Build credit

Jazzlore was designed and built by Aurélien Fontaine as a hands-on exploration
of AI-augmented software engineering. The implementation work was paired with
Anthropic's Claude (via Claude Code) over a single-author build cycle in 2026.
Commits carry a `Co-Authored-By` trailer where Claude contributed substantively
to the change.
