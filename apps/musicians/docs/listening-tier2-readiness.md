# Tier-2 listening enrichment — readiness report

A dry-run assessment after walking the Tier-1 process manually for the 12
curated musicians. The companion deliverable is the proposed track table
(in chat; not yet committed to `curated.ts`). This report answers the four
questions you posed before automating Tier 2.

## 1. Artist disambiguation

### What we saw on the 12

Zero disambiguation incidents — but that's a misleading signal. The 12
curated are top-tier canonical figures whose Spotify/Apple artist pages
dominate name searches. The famous-Wikidata-figure ↔ platform-canonical-
artist match was effectively trivial. **That tells us nothing about
Tier-2-at-scale.**

The structural problem is the same namesake hazard already encoded in
the populator's `consolidate-mb-redirects` pass:

| Wikidata id | Display name | Platform-canonical risk |
|---|---|---|
| Carl Perkins (jazz pianist) | "Carl Perkins" | "Carl Perkins" on Spotify is the rockabilly star — buried artist mismatch |
| George Lewis (NO clarinetist) vs (trombonist) | "George Lewis" | Two real jazz musicians, both legitimate Spotify pages |
| Bill Evans (pianist Q208205) vs (saxophonist Q862106) | "Bill Evans" | Already encoded in `curated.ts` after the P0 merge — proving the populator side handles it; the streaming side will rediscover it |
| Bobby Jones, Frank Foster ×2, Sam Jones (×3), … | various | sidemen with very common names |

### Recommended Tier-2 resolution order (id-only, populator-pattern-aligned)

1. **MusicBrainz `url-rels` → Spotify / Apple artist id** — free, 1 req/sec
   (existing throttle), deterministic. MB stores `streaming music` URL
   relations that include both Spotify and Apple Music artist links for
   most catalogued jazz figures. **This is the cheapest, safest path**
   and exactly mirrors how `_discogs_id_from_url_rels` was added in the
   2026-05-20 cleanup arc.
2. **Wikidata properties** — `P1902` (Spotify artist id), `P9831` (Apple
   Music artist id), `P11625` (Spotify track id for the artist's
   signature work). When present, deterministic.
3. **MB MBID → Spotify search → multi-signal fingerprint**. Only when
   (1) and (2) miss. Probabilistic; reject unless `albums` overlap with
   our records ≥3 AND `genres` intersect jazz AND the active-year
   midpoint falls within ±5y of our `years_active_start/end`.

**Hard skip** before any resolver runs: if the MB artist has
`disambiguation ∈ {"rockabilly", "opera", "country", "reggae", "K-pop",
…}` *and* no jazz tag in our store, mark as `streaming.skipped:
disambiguation-mismatch` and move on. Same posture as
`make queue-skip-ineligible`.

The id-only rule from `CLAUDE.md` carries over verbatim: **never resolve
by name alone**.

## 2. The "most popular" question (algorithmic vs editorial)

### On the 12: how often did `top_tracks[0]` match the editorial signature?

Estimating against Spotify's `GET /v1/artists/{id}/top-tracks` (popularity-
ranked, last ~30 days of streams, region-weighted to `market=US`):

| Musician | Editorial pick (this dry-run) | Likely Spotify `top_tracks[0]` | Match? |
|---|---|---|---|
| Miles Davis | "So What" | "So What" or "Flamenco Sketches" | ≈ tie — usually OK |
| John Coltrane | "Acknowledgement" (hook → spiritual) | "My Favorite Things" or "Naima" | **DIVERGES** |
| Bill Evans | "Waltz for Debby" | "Waltz for Debby" | OK |
| Thelonious Monk | "'Round Midnight" | "'Round Midnight" | OK |
| Bobby Timmons | "Moanin'" (Blakey cut) | possibly "Moanin'" or "This Here" | OK / tie |
| Charles Mingus | "Goodbye Pork Pie Hat" | "Goodbye Pork Pie Hat" | OK |
| Art Blakey | "A Night in Tunisia" (press-roll hook) | "Moanin'" | **DIVERGES** (and Moanin' is also Timmons's signature) |
| Herbie Hancock | "Cantaloupe Island" | "Cantaloupe Island" or "Watermelon Man" | usually OK |
| Wayne Shorter | "Footprints" | "Footprints" | OK |
| Cannonball Adderley | "Mercy, Mercy, Mercy" | "Mercy, Mercy, Mercy" | OK |
| Sonny Rollins | "St. Thomas" | "St. Thomas" | OK |
| Wes Montgomery | "Four on Six" | "Bumpin' on Sunset" or "Goin' Out of My Head" (pop-jazz era) | **likely DIVERGES** |

**Expected divergence: ~3 of 12 (25%) on track identity** — but the
deeper problem hides under "match." See next paragraph.

### The version trap (worse than the track trap)

Even when the track name matches, the platform surface that comes back
is usually **not** the original recording:

- **"Cantaloupe Island"** — only one Spotify result, and it's the
  *Remastered 1999 / Rudy Van Gelder Edition* on the *Empyrean Isles
  Expanded Edition*. Same performance, different track id from "the
  album as released in 1964". Fine in this case. Generally fine for
  Blue Note (the catalogue is collapsed onto RVG remasters).
- **"So What"** — at least six distinct track ids on Spotify:
  vanilla *Kind of Blue*, *Kind of Blue (Legacy Edition)* (which
  surfaces with `feat. Coltrane, Adderley, Evans` because Spotify auto-
  inflates the credits), *Studio Sequence 1* (alt take), at least two
  live Den Haag 1960 takes, and regional duplicates. Picking the wrong
  one breaks dedup downstream.
- **"A Night in Tunisia"** — the *studio* Blue Note version (the one with
  Blakey's iconic press-roll intro that the hook explicitly references)
  is harder to find than the live Tokyo 1961 takes which dominate the
  top of search. Algorithmic-popular will probably pick a live one.
- **"Moanin'"** — credit attribution flips across pressings:
  "Art Blakey & The Jazz Messengers", "Lee Morgan, Benny Golson, Bobby
  Timmons, Jymie Merritt, Art Blakey", or just "Art Blakey". Tier 2
  needs to deduplicate by canonical recording, not by track id.

### Recommended Tier-2 ranking rule

Take Spotify's `top_tracks` (10 results, popularity-ordered) and apply
filters in order:

1. **Drop compilations**: filter `album.album_type == "compilation"`.
2. **Drop "best of" / "greatest" by album name**: regex
   `/(best of|greatest|collection|essential|anthology|the complete)/i`.
3. **Drop live takes** unless the only viable track is live (Cannonball
   "Mercy, Mercy, Mercy" is iconically live — keep it). Heuristic:
   filter `album.name` regex `/live|in concert|at the/i` unless ≥80%
   of top_tracks are live.
4. **Drop "feat." re-credits** if a non-feat. version with the same
   primary artist exists in `top_tracks`.
5. **Drop tracks where `album.release_date` is >2y after the artist's
   `years_active_end`** (catches the 2018 / 2025 remaster reissues
   that drown originals).
6. Return the first survivor.

Fall back to raw `top_tracks[0]` if all filters reject — better to ship
a remaster than nothing.

**Editorial override file** for the 5-10% of cases where the algorithm
gets it wrong: `data/streaming_overrides.jsonl` keyed by musician id,
one line per override. Same shape as `id_aliases.jsonl` and the disambig
review doc emitted by `consolidate-by-disambig`. Hand-curated; trumps
algorithmic picks at projection time.

## 3. API/effort estimate

### Spotify Web API

- **Auth**: client credentials flow. `client_id` + `client_secret` from
  the Spotify developer dashboard — **free, no $/year**. Same shape as
  `DISCOGS_TOKEN` in `.env`.
- **Endpoints used**:
  - `GET /v1/search?q=…&type=artist` — initial artist resolution
    (fallback path only — prefer MB url-rel as per §1).
  - `GET /v1/artists/{id}/top-tracks?market=US` — signature track pick.
  - `GET /v1/tracks/{id}` — for the filter rules above (album_type,
    release_date).
- **Rate limit**: soft ~180 req/min per app; no daily cap on
  `client_credentials`. Tokens TTL 1h, auto-refresh.

### Apple Music API

- **Auth**: developer JWT, signed with a `.p8` private key + key id +
  team id. Requires Apple Developer Program membership: **$99/year** —
  the gating cost. JWT TTL up to 6 months.
- **Endpoints used**: `GET /v1/catalog/{storefront}/search?term=…&types=artists`,
  `GET /v1/catalog/{storefront}/artists/{id}/songs`.
- **Rate limit**: ~20 req/sec.
- **Storefront**: pin to `us` for canonical ids; user's Apple Music
  client will re-resolve to their regional catalog automatically when
  they tap the link.

### Cheaper path you should consider first

Skip Apple Music API entirely for v1. **Use MusicBrainz `url-rels` to
get both Spotify *and* Apple Music artist URLs** in a single MB call.
MB stores them. That collapses the dependency on the Apple developer
account (and the $99/year) at the cost of being limited to whatever
MB has — but MB coverage for the top-2000 jazz figures is high
(estimated 90%+; verifiable cheaply by counting `url-rels` of type
`streaming music` for our existing musicians).

Track-level deep-link IDs are still platform-API-only, but for v1 the
artist landing page is often enough — the user lands on the artist
top-tracks list which is what `top_tracks` would have returned anyway.

### Storage / projection

**New sidecar `data/streaming_ids.jsonl`** — one line per musician:

```json
{
  "musician_id": "wikidata:Q107432",
  "spotify_artist_id": "4kqMpJk2QmkdjBOLpZxlsm",
  "spotify_track_id": "5eKnpzuUKdgjAKqEpWtbwD",
  "apple_artist_id": "478880",
  "apple_song_id": "282907093",
  "resolved_via": "mb_url_rel",
  "resolved_at": "2026-05-24T20:30:00Z"
}
```

Same shape as `id_aliases.jsonl`. **Do not** modify `schema.py`'s
`Musician` model — streaming is a presentation-layer concern that
doesn't belong on the source-of-truth node. The publish step projects
the sidecar onto `:Musician` properties at export time (one extra
`UNWIND` chunk in `_publish_jsonl`, same pattern as image fields). The
frontend reads them via the normal node query.

### Effort estimate

Mirror the Discogs phase shape:

- `jazzdb/sources/spotify.py` (~200 lines) — client_credentials auth,
  artist resolution, top_tracks, track lookup, the filter rules
  above.
- `jazzdb/sources/apple_music.py` (~150 lines, optional for v1) — JWT
  signing, artist/song resolution. **Skip for v1** if going MB-only.
- `jazzdb/enrich_streaming.py` (~250 lines) — top-down by degree,
  resumable, graceful-stop, `--figure`/`--top N`/`--all` scope knobs,
  flush to `streaming_ids.jsonl` every N entries.
- `jazzdb/publish.py` patch (~40 lines) — read the sidecar, emit two
  extra UNWIND chunks.
- `tests/test_streaming_*` (~150 lines) — the filter rules deserve
  unit coverage (most-popular trap rules); MB url-rel parse; offline
  smoke for the resolver.
- Makefile targets: `enrich-streaming-curated`, `enrich-streaming
  TOPN=N`, `enrich-streaming-all`.

**Total ~2 working days** for a v1 that uses MB url-rels only (no
Apple developer account needed). Add ~1 day for Spotify Web API
top-tracks ranking + filter rules. Add ~1 day for native Apple Music
API integration if MB url-rel coverage on Apple side disappoints.

## 4. Coverage expectation

For the top ~2,000 highest-degree musicians:

| Bucket | Spotify artist | Apple Music artist | Defensible signature track |
|---|---|---|---|
| Top 50 (canonical leaders) | ~100% | ~100% | ~95% |
| Top 51–500 (well-known leaders + first-call sidemen) | ~95% | ~90% | ~85% |
| Top 501–2000 (deep sidemen + obscure leaders) | ~80% | ~70% | ~70% |

Where it will break:

- **Pre-1940s figures and obscure pre-bebop pioneers** — many have no
  Spotify presence, or only on compilation albums. Apple slightly
  worse here.
- **Eastern European / Soviet / Latin American jazz** — both
  platforms thin.
- **Session sidemen who never released as leaders** — they exist on
  the records but have no Spotify artist page, only credits on
  someone else's albums. The `top_tracks` endpoint returns
  meaningless results (their best-known album appearance, not a
  signature).
- **Vocalists who appeared on jazz sessions but are catalogued under
  R&B/pop on platforms** — searching their MB → Spotify gets the
  pop catalog page, not the jazz appearances.
- **Living musicians with rare-historical recordings only** —
  catalogue rights tangled, platform versions are 2010s reissues
  only.

Hard pocket count guess: **~300–400 of the top-2000 will have no
defensible signature track** even with the best resolver. Show
"Listen" CTA only when `streaming_track_id IS NOT NULL`; for the
no-data cases the card just doesn't show the link — same posture as
the absent-field rendering already in the design system.

## Recommendation: automate Tier 2, but stage it like the Discogs phase

Don't fire it at all 2,000 in one shot. Stage with checkpoints:

1. **Top-50 (resumable)** → publish → manual editorial review of *every*
   track choice. This is the calibration step for the filter rules.
   Tune `streaming_overrides.jsonl` from the misses.
2. **Top-500** → publish → spot-check 50 random entries → flag false
   picks → expand overrides.
3. **Top-2000** → publish → ship.
4. **Long tail (top-2001+)** → opt-in or pre-fetched lazily on first
   detail-page visit (with a server-side cache). Don't pre-enrich.

Same shape as `backfill-discogs-curated` → `backfill-discogs-personnel
TOPN=2000` → `backfill-discogs-personnel --all`. The plan is
load-bearing — manual at the front, automation hardening in the middle,
free-flow at the end.

## Tier-1 manual outcome (this dry-run)

12 / 12 musicians resolved. 0 disambiguation misses (small N; not
load-bearing). 1 Apple Music URL required a second search to find
("St. Thomas" — the `site:` query missed it; the broader query
returned it). ~3 of 12 had genuinely ambiguous version picks (Spotify
returns multiple plausible canonical takes for the same recording).
~2 of 12 have hook-driven editorial picks that diverge from likely-
algorithmic-popular (Coltrane "Acknowledgement" over "My Favorite
Things"; Blakey "A Night in Tunisia" over "Moanin'"). One pick
(Sonny Rollins "St. Thomas") has a hook→track tension worth your
explicit call — see the table.

**Tier 1 → Tier 2 readiness: GREEN with caveats.** The filter rules
above need to land before the top-50 calibration run, but the overall
shape (MB url-rels → Spotify top_tracks → filter → editorial-override
sidecar) is solid and mirrors how the Discogs phase shipped.
