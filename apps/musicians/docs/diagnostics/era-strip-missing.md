# "From the same era" missing — root-cause analysis

> Diagnosis only — no fix. Evidence: repo reads + live BFF curl + a corroborating
> bundle Explore (all agree). Dated 2026-05-19.

## Verdict: a data-wiring gap, NOT a build/CSS/suppression issue. The cleanest of the three.

- **Is `EraStrip` shipped?** **YES.** Statically imported by `DetailView` (which ships);
  minified strings `"From the same era"` + classes `era-h`/`era-strip`/`era-tile` present
  in prod JS (`/assets/index-*.js`). Not a build issue.
- **Is it mounted in `DetailView`?** **YES.** `DetailView.tsx` renders
  `<EraStrip items={sameEra} onActivate={goToMusician} />` between `CollaboratorRail` and
  `RecordsStrip` (spec-correct slot).
- **Mounted ⇒ CSS-suppressed or empty-data?** **Empty data — self-hides.**
  `apps/musicians/src/components/EraStrip.tsx:26`: `if (items.length === 0) return null`
  (documented "Renders nothing when empty"). NOT CSS suppression.
- **Integration wired?** Component-level yes; one layer up, **NO** — data never supplied,
  `sameEra` permanently `[]`.

## The exact chain (verified)

1. BFF `/api/musicians/:id` returns only a **singular `era: "<label>"` string**
   (deriveEra/`worker/era.ts`, applied post-map at `endpoints.ts:130`) — live-confirmed
   `"era":"Bebop"` (Miles), `"Modal"` (Bill Evans). **No `sameEra`/`contemporaries`
   array anywhere** in the response.
2. Frozen `apps/musicians/src/lib/types.ts` `MusicianDetail` has `era?: string` only —
   **no `sameEra`** (intentional; era taxonomy left out of frozen contract).
   `lib/map.ts mapMusicianDetail()` produces no `sameEra`.
3. `apps/musicians/src/hooks/useMusicianData.ts` `httpSource.detail()` returns the BFF
   `MusicianDetailResponse` verbatim — no `sameEra` map/derivation.
4. `apps/musicians/src/pages/MusicianPage.tsx:65` renders `<DetailView detail={…}
   duplicate={…} source={…} />` — **never passes a `sameEra` prop**.
5. `DetailView.tsx:62` `sameEra = []` default ⇒ `<EraStrip items={[]} />` ⇒ returns
   `null` ⇒ section absent.

The DetailView prop comment: *"Editorial 'same era' contemporaries (Phase C supplies;
absent → the strip hides itself)"* — **Phase C never implemented the contemporaries
data.** Component + contract sound; the feature's data layer was never built end-to-end.

## How this differs from CRIT-1 / CRIT-2

CRIT-1 & CRIT-2 are CSS containment defects sharing the `.desk-rail`/`.rec-strip`
uncapped-content root. **This is unrelated** — a missing data feature. Fix is purely
additive, touches **no shared CSS** and **no frozen lib**:
- BFF: a new read-only Cypher returning era/period peers (same era/genre/years-active
  band, *excluding* collaborators — the design's "contemporaries who weren't in their
  bands"), shaped to `EraItem[]`.
- `httpSource.detail` / `MusicianDetailResponse`: carry `sameEra` as a sibling (frozen
  `MusicianDetail` intentionally agnostic).
- `MusicianPage` → pass `sameEra` to `DetailView`. **`EraStrip` itself: zero changes.**

## Critical files

- `apps/musicians/worker/cypher.ts` + `endpoints.ts` (add the peers query; include in
  `/api/musicians/:id` payload sibling to `era`)
- `apps/musicians/src/hooks/useMusicianData.ts` (`httpSource.detail` surface `sameEra`)
- `apps/musicians/src/pages/MusicianPage.tsx:65` (pass `sameEra` into `DetailView`)
- `apps/musicians/src/features/detail/DetailView.tsx:62,155` (prop already wired)
- `apps/musicians/src/components/EraStrip.tsx` (already correct — reference only)

## Verify (read-only)

`curl -s 'https://musicians.jazzlore.com/api/musicians/wikidata%3AQ93341' | python3 -m
json.tool` → keys include `era` (string) but no `sameEra`/`contemporaries`. Live DOM on
any detail page → no `[aria-label="From the same era"]`. Grep prod JS for `From the same
era` → present (shipped). Confirms: shipped + mounted, self-hidden on empty, data never
supplied.
