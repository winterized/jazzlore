# Musicians v1 — design-fidelity diagnostics (2026-05-19)

Post-launch the live site (`musicians.jazzlore.com`) deviates substantially from the
pass-5 design. These are the **evidence-based root-cause diagnoses** (read-only,
verified on prod). **No code has been touched.** Next step: design ONE joint fix plan
covering everything below.

## Diagnosed (root cause established + verified)

| # | File | Verdict |
|---|---|---|
| CRIT-1 | [`CRIT-1-portrait-grid-blowout.md`](./CRIT-1-portrait-grid-blowout.md) | CSS-Grid `minmax(auto,1fr)` track blowout; portrait is a *symptom*. Empirically confirmed (Miles 14624px vs Antoine 420px). |
| CRIT-2 | [`CRIT-2-desktop-graph-panel.md`](./CRIT-2-desktop-graph-panel.md) | Original "no graph/no 2-col" was FALSE (probe artifact). Real defect: graph panel vertically unbounded (800×2926). |
| Era | [`era-strip-missing.md`](./era-strip-missing.md) | Data-wiring gap — `EraStrip` shipped+mounted, self-hides on empty; BFF never supplies `sameEra`. |

## Shared root (CRIT-1 + CRIT-2 + "records dumped")

CRIT-1, CRIT-2, and the HIGH "records dumped, not a strip" finding are **one root**:
`.desk-rail`'s content is uncapped / not scroll-contained — the **non-wrapping
`.rec-strip` (all 64+ records) is the worst offender** — plus grid items lacking
`min-width:0` (CRIT-1) / a bounded height (CRIT-2). Fixing the rail's content
containment (esp. the records strip) + binding the desktop graph panel to the viewport
collapses these three to ~one fix. **Era is independent** (additive data feature; no
CSS / no frozen lib).

## Audit items still needing SEPARATE fixes (not yet RCA'd; scope into the joint plan)

- **Bio teaser** — full Wikipedia paragraph dumped on the page (470 chars) instead of a
  1-line italic editorial teaser; duplicated verbatim in the "More about" sheet.
- **Identity meta line** — live `trumpet · Bebop · 1926–1991` vs design `Trumpet ·
  Cool · Modal · Fusion · 1926–1991` (cap instrument · genre chain · years); single
  weak/often-wrong era from `deriveEra`.
- **Home subtitles** — wrong data/era (e.g. Mingus "Bebop · piano" — he's a bassist;
  Wes Montgomery "Fusion" — hard bop).
- **ConnRow context** — missing the "relationship/context" half ("· First Great
  Quintet, 1955–60"); some rows show no instrument at all.
- **Tab title** — browser `<title>` never updates client-side (stays "Jazzlore — Jazz
  musicians"; server injects per-musician title for crawlers only).
- **Header toggle** — uses the theme toggle where the design has a "···" overflow.
- **Mosaic verification** — confirm duotone tiles size-encode record count + the
  tap→scroll + 1.4 s pulse interaction (not yet verified).

## Status

Plan-mode planning; **no code touched**. The full RCA scratch also lives at
`~/.claude/plans/temporal-bouncing-bubble.md` (transient — these repo files are the
durable record). Next: a single joint fix plan covering the shared-root CRIT cluster,
the Era data wiring, and the separate audit items above — then execute.
