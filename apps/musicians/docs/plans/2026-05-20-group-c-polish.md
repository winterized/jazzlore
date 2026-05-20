# Musicians v1 — Group C polish plan (8 items)

> Plan only. **No code touched.** On approval persisted to
> `apps/musicians/docs/plans/2026-05-20-group-c-polish.md`.

## Context

Groups A and B shipped end-to-end on 2026-05-20 (PRs #27/#29/#28/#30 on
`main`). The structural defects (CRIT-1/CRIT-2/records-dump) and the Era
strip data wiring are fixed and live on `musicians.jazzlore.com`. What
remains is the design-fidelity + small-correctness work — 7 items from
the original audit + 1 surfaced by the post-merge prod check (the era
peers NULL-handling that paired Antoine with Sinatra).

These are small, mostly independent surface fixes — not structural
defects. The fix shape is **different from Groups A/B**: no shared root
cause, no joint dependency. The discipline is: small reversible PRs,
each through the standing code-reviewer policy, bundled where they share
a BFF file (to avoid serial-merge friction), shipped standalone where
disjoint. Same verification gates as A/B (production URL + multiple
viewports + real data + predicates). Frozen `lib/types.ts` + `lib/map.ts`
still apply — anything new on the response shape rides as a sibling.

## Live evidence (from read-only BFF curls, 2026-05-20)

These ground the triage:

- `/api/musicians/wikidata:Q586360` (Antoine) → 12 `sameEra` peers because
  his `years_active_start/end` are NULL, opening the year-window filter.
- `/api/musicians/wikidata:Q93341` (Miles) → **525** collaborators, **0**
  of them have `relationship` populated. The frozen `Collaborator` type
  carries the field; the BFF has never emitted it.
- `/api/musicians/curated` → subtitles like `Bebop · trumpet` for Miles,
  `Bebop · piano` for Mingus, `Modal · piano` for Bill Evans. The era
  half is the single-era `deriveEra` issue; the instrument half is broken
  for Mingus because Aura's `primaryInstrument` IS `'piano'` for him
  (`wikidata:Q107432` in the search-index) — factually wrong data, not a
  composition bug. Same shape likely for Wes Montgomery + others.

## Triage table

Tier legend: **R** = real user issue (factually wrong or broken
behavior). **D** = design fidelity (deviates from pass-5 design, not
broken). **V** = verification-only.

| # | Item | Tier | Minimum viable fix | PR | Files touched |
|---|---|---|---|---|---|
| 1 | Era peers NULL handling | R | `peersByEraCypher` gates on `m.years_active_start IS NOT NULL AND m.years_active_end IS NOT NULL`; else return empty result set → `sameEra: []` → EraStrip self-hides for sparse musicians. ~5 lines. | **C-bff** | `apps/musicians/worker/cypher.ts` |
| 4a | Home subtitles era half | R | Curated subtitle uses `genres[0]` (single, mobile-space-constrained) instead of the single `deriveEra` label. The detail-page meta chain (item 2) renders the full `genres` list. PR body documents this deliberate choice: mobile-card subtitles want one label; detail pages want the chain. ~10 lines. | **C-bff** | `apps/musicians/worker/endpoints.ts` |
| 4b | Home subtitles instrument half | R | **DEFERRED to populator-side ticket.** Mingus's `primaryInstrument: 'piano'` on `wikidata:Q107432` in Aura is an UPSTREAM data-quality bug — we own both ends of the pipeline (populator → Aura → BFF), so the discipline is to fix the source, not shim a worker-side override map. Filed as a follow-up note at `apps/musicians/docs/follow-ups/2026-05-20-populator-instrument-data-quality.md` (or equivalent — actual location depends on where the populator lives). Same shape as the duplicate-pair issue: don't paper over upstream bugs in the downstream layer when we own both. | **— (populator ticket)** | — |
| 5 | ConnRow relationship/context | D | **DEFERRED from Group C.** Field is unpopulated for 0/525 of Miles' collaborators today; the codebase has no editorial data source yet. Ships in a future cycle once a source is chosen (curated YAML, derived from band names parsed from record titles, hand-coded const, etc.) and the editorial set is sized. Out of scope here — keeps Group C tight. | **— (deferred)** | — |
| 6 | Tab title | R | `useEffect` setting `document.title` in `MusicianPage` (per-musician) and `HomeView` (resets to default). Cleanup on unmount. ~10 lines per page. | **C-title** | `apps/musicians/src/pages/MusicianPage.tsx`, `apps/musicians/src/features/home/HomeView.tsx` |
| 7 | Header "···" overflow | D | New `OverflowMenu` component (button + popover); replaces `<ThemeToggleButton />` in the top-right slot; theme toggle moves INSIDE the menu. Future items can land here (settings, etc.). a11y: button + menu role + keyboard nav. ~80 lines incl. tests. | **C-overflow** | `apps/musicians/src/components/OverflowMenu.tsx` (new), `apps/musicians/src/features/home/HomeView.tsx`, `apps/musicians/src/features/detail/DetailView.tsx` |
| 2 | Identity meta chain | D | Render the EXISTING `genres` array from the BFF (capitalize each) + capitalize instrument. Chain = `Trumpet · Cool jazz · Modal jazz · 1926–1991`. Note: design's "Cool · Modal · Fusion" used short-form labels; we use Aura's `genres` strings + Title Case (no mapping table). ~15 lines. | **C-meta** | `apps/musicians/src/components/DetailIdentity.tsx` |
| 3 | Bio teaser + sheet dedup | D | Client-side first-sentence split for the page teaser (italic, single line); `MoreAboutSheet` renders the full `bioSummary` (not duplicated minus teaser — sheet is a separate context, having full bio is fine even with teaser elsewhere). ~15 lines. | **C-meta** | `apps/musicians/src/components/DetailIdentity.tsx`, `apps/musicians/src/features/detail/MoreAboutSheet.tsx` |
| 8 | Mosaic verification | V | Playwright MCP on prod: confirm duotone tiles paint (sample pixel), size encodes record count (compare Miles' largest vs Antoine's smallest tile rect), 1.4 s pulse fires on tap+scroll-land. Per Group C inventory the behaviour is implemented; this is a "verify on the fixed layout" pass. | **(no PR)** | — |

## PR grouping + execution order

**Wave 1 — three parallel PRs (file ownership provably disjoint):**

```
                      ┌──────────────────────────────────────────────┐
                      │ Coordinator (this session)                    │
                      │  - reads this plan, dispatches Wave 1 streams │
                      └─────────────────────┬────────────────────────┘
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
   ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
   │ PR C-bff             │     │ PR C-title           │     │ PR C-overflow        │
   │ items 1, 4a          │     │ item 6               │     │ item 7               │
   │ BFF data cluster     │     │ document.title       │     │ "···" menu           │
   │ worker/cypher.ts     │     │ MusicianPage.tsx     │     │ Shell/HomeView/Detail│
   │ worker/endpoints.ts  │     │ Shell.tsx            │     │ + OverflowMenu (new) │
   │                      │     │                      │     │                      │
   └──────────┬───────────┘     └──────────┬───────────┘     └──────────┬───────────┘
              │                            │                            │
              └────────────────────────────┴────────────────────────────┘
                                           ▼
                              ┌────────────────────────────┐
                              │ Wave 1 merges (each its own│
                              │ deploy + prod gate-3 run)  │
                              └─────────────┬──────────────┘
                                            ▼
                          ┌──────────────────────────────────┐
                          │ PR C-meta — Wave 2 (single)      │
                          │ items 2, 3                       │
                          │ Identity meta chain + bio teaser │
                          │ DetailIdentity.tsx               │
                          │ MoreAboutSheet.tsx               │
                          └─────────────┬────────────────────┘
                                        ▼
                          ┌──────────────────────────────────┐
                          │ Mosaic verification (no PR)      │
                          │ Playwright MCP on the fixed prod │
                          └──────────────────────────────────┘
```

**Why this order:**

1. **C-bff first / highest-value** — fixes 2 real user issues (era peers giving wrong data, Mingus shown as pianist) + the scaffolding for ConnRow context. Single BFF deploy.
2. **C-title in parallel** — totally independent files; trivial fix; fastest win.
3. **C-overflow in parallel** — independent files; design fidelity; no contention with anything else.
4. **C-meta in Wave 2** — DetailIdentity.tsx is shared between items 2 and 3 (cannot parallelize). Waiting for C-bff lets us verify against the corrected era field (item 4) so the meta line isn't lying anymore. Bundled.
5. **Mosaic verification last** — natural visual check after the layout + composition is fully fixed.

**File-ownership table (pre-flight comm-12 check before parallel kickoff — same discipline as Groups A/B):**

| File | C-bff | C-title | C-overflow | C-meta |
|---|:---:|:---:|:---:|:---:|
| `worker/cypher.ts` | ✏️ | — | — | — |
| `worker/endpoints.ts` | ✏️ | — | — | — |
| `src/pages/MusicianPage.tsx` | — | ✏️ | — | — |
| `src/components/Shell.tsx` | — | ✏️ | — | — |
| `src/features/home/HomeView.tsx` | — | — | ✏️ | — |
| `src/features/detail/DetailView.tsx` | — | — | ✏️ | — |
| `src/components/OverflowMenu.tsx` (new) | — | — | ✏️ | — |
| `src/components/DetailIdentity.tsx` | — | — | — | ✏️ |
| `src/features/detail/MoreAboutSheet.tsx` | — | — | — | ✏️ |

Disjoint by construction (item 5 deferred removed `ConnRow.tsx` from the
picture; the title `useEffect` lands in `Shell.tsx` via a `useTitle(name)`
hook so the HomeView/Shell overlap I'd otherwise have between C-title +
C-overflow doesn't exist). `comm -12` will be empty.

## Per-PR acceptance criteria

Each PR carries the same skeleton: localhost gates (typecheck, lint, unit
tests, a11y) PLUS a live prod check post-merge against
`musicians.jazzlore.com` (the same pattern Groups A and B used). The
joint-fix-acceptance spec is the verification surface; each PR adds its
own predicate(s) to it.

### PR C-bff (items 1, 4a)

**Localhost gates:**
- `pnpm typecheck` exit 0; `pnpm lint` exit 0
- `pnpm -F @jazzlore/musicians test:run` exit 0 (new unit tests for the Cypher NULL gate + the curated-subtitle era-source change)
- `pnpm test:e2e musicians-a11y --project=chromium` exit 0 (12 passed)

**Live prod gate** (`PREVIEW_BASE=https://musicians.jazzlore.com`):
- **Item 1 predicate:** `curl /api/musicians/wikidata%3AQ586360 | jq '.sameEra | length'` === 0 (Antoine, NULL years → empty).
- **Item 1 regression guard:** `curl /api/musicians/wikidata%3AQ93341 | jq '.sameEra | length'` ≥ 1 (Miles, well-curated → still has peers).
- **Item 4a predicate:** `curl /api/musicians/curated | jq '.curated[] | select(.id == "wikidata:Q93341") | .subtitle'` no longer equals `Bebop · trumpet`; equals something derived from `genres[0]` (e.g. `cool jazz · trumpet`). The era half is the first Aura genre, not the single-`deriveEra` label.
- **Item 4a documentation gate:** PR body explicitly explains the deliberate choice — mobile-card subtitles use `genres[0]` (one label, space-constrained); detail-page meta chain (item 2, C-meta) renders the full `genres` list.
- **Item 4b note in PR body:** Mingus shown as pianist is an upstream populator-side data bug at `wikidata:Q107432.primaryInstrument`, deferred to a populator-side ticket per the "own both ends → fix source, don't shim consumer" discipline. Link to the follow-up note.
- Joint-fix-acceptance spec: existing 21 still pass.

### PR C-title (item 6)

**Localhost gates:** typecheck, lint, unit (new hook test), a11y.

**Live prod gate:** new test in joint-fix-acceptance spec — navigate to `/musicians/wikidata:Q93341` → assert `await page.title()` === `"Miles Davis — Jazzlore"` (or chosen format). Navigate to `/musicians` → assert title resets to `"Jazzlore — Jazz musicians"`. Tests a real client-side SPA navigation, not a full page load.

### PR C-overflow (item 7)

**Localhost gates:** typecheck, lint, unit tests for `OverflowMenu` (open/close, keyboard nav, focus trap if menu opens as a popover), a11y (axe still 0 violations — the new menu must have correct role + aria-controls + aria-expanded).

**Live prod gate:** new tests in joint-fix-acceptance spec at each of the 5 viewports — assert the top-right slot is a button with `aria-label="More options"` (or similar) AND clicking it opens a menu containing a "Toggle theme" item. Visual screenshots into `apps/musicians/docs/baseline/joint-fix/overflow/`.

### PR C-meta (items 2, 3) — Wave 2

**Localhost gates:** typecheck, lint, unit (DetailIdentity + MoreAboutSheet snapshots / behavioral tests), a11y.

**Live prod gate:** new tests in joint-fix-acceptance spec —
- Item 2: navigate to Miles → assert meta line `<div class="ml">` text matches `/Trumpet · .+ · .+ · 1926–1991/` (capitalized instrument + ≥1 genre + years).
- Item 3: navigate to Miles → assert the page bio teaser is a single line (one `<p>` or `<em>` with text length < 200 chars, italic style via `getComputedStyle(...).fontStyle === 'italic'`); open the sheet → assert full bio is present (`textContent.length > 300`).

### Mosaic verification (item 8) — no PR

Coordinator runs the Playwright MCP against `https://musicians.jazzlore.com`:
1. Navigate to detail page (Miles is the best case — most collaborators) at 390 viewport. Take screenshot.
2. Assert tiles have duotone (sample a pixel from the largest tile — should NOT be the neutral background; should be a duotone-mixed color).
3. Assert size encodes record count: find the LARGEST `.mtile.hero` rect.width vs the smallest `.mtile`. Ratio should be > 1.5.
4. **Pulse-lifecycle assertion** (don't assert `window.scrollY` change — the targeted ConnRow may already be in view, in which case there's nothing to scroll). Pick a target `.mtile` whose `data-musician-id` (or equivalent) maps to a known `ConnRow.conn[data-id="…"]`. Tap the tile. Assert:
   - `.conn.pulse` appears on the targeted ConnRow within **200 ms** of the tap (`expect.poll(() => row.classList.contains('pulse')).toBe(true)` with 200 ms poll budget).
   - `.conn.pulse` is removed within **1.6 s** of when it appeared (the implementation uses `PULSE_MS = 1400`; 1.6 s is the budget with composite slack).
   The hook is documented as "scroll-land via IntersectionObserver", but the assertion targets the user-visible outcome (the pulse class on the right row), not the mechanism — so it holds whether the row was already in view (no scroll) or was scrolled into view (IntersectionObserver fires on land).

Findings go into a 1-page Markdown note at `apps/musicians/docs/diagnostics/mosaic-verification.md`. If anything is BROKEN, file a follow-up PR; if all passes, mark item 8 complete in the Group C state.

## Frozen contract reminders (applies to ALL PRs)

- **NEVER** touch `apps/musicians/src/lib/types.ts` or `apps/musicians/src/lib/map.ts`. Frozen byte-identical since `cfd3540`.
- New BFF response fields ride as siblings (not inside `MusicianDetail`).
- `EraStrip.tsx` is correct — Group B already shipped its wiring; do not touch.

## Standing policy reminders

- Per `[[feedback-always-code-reviewer]]`: every PR I author gets a
  `oh-my-claudecode:code-reviewer` pass before merge. No exceptions.
- Per `[[feedback-merge-method]]`: preserve history with `gh pr merge
  --merge`, not `--squash`.
- Per `[[feedback-verify-gate-output]]`: explicit pass/fail per gate,
  not tail-truncated pipeline exits.
- Per `[[feedback-deploy-autonomy]]`: auto-deploy on green; user tests
  in prod.
- Per `[[reference-mcp-neo4j-database]]`: MCP neo4j tool fails on Aura
  db `d30e12cc`; use BFF as the read surface for any schema-discovery.

## Verification harness reuse

The joint-fix-acceptance spec at `tests/e2e/musicians-joint-fix-acceptance.spec.ts`
is the single live-prod verification surface. Each PR adds its predicate
block; the post-merge gate run is the same shape as for Groups A and B.

Existing predicates that MUST stay passing across Group C:
- A1.1–A1.4 + A2.1–A2.4 (Stream A's structural predicates — the joint
  fix's reason to exist)
- Miles "From the same era" present with ≥ 1 tile (Stream B)
- Page total scroll height sane at Miles m390 (regression guard)

## Fallback to sequential (matches Groups A/B's discipline)

Collapse Wave 1's parallelism to A→B→C-overflow if:
1. The `comm -12` check finds overlap (it shouldn't — table above is
   provably disjoint, but verify).
2. C-bff's BFF changes break C-title's e2e (unlikely — disjoint
   subsystems, but theoretically a regression could cascade).
3. C-overflow's new `OverflowMenu` import path collides with C-title's
   shell-level title hook (defuse by deciding upfront: `useTitle` is a
   hook in `src/hooks/useTitle.ts`, not a Shell.tsx export).

In every fallback, **C-bff first** (highest user-value), then the rest.

## Plan status

- Plan-mode artifact at `~/.claude/plans/temporal-bouncing-bubble.md`
  (this file). On approval, persist to
  `apps/musicians/docs/plans/2026-05-20-group-c-polish.md`.
- Kickoff after approval: spawn Wave 1's three streams in parallel
  (separate worktrees, executor + code-reviewer per stream). Each PR
  goes through localhost gates → reviewer → fixup → merge → deploy →
  prod predicate. C-meta follows after Wave 1's BFF settles.

**No code is touched by this plan.** Next action after approval is the
pre-flight `comm -12` against the table above + Wave 1 spawn.
