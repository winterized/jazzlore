# Populator follow-up — primary_instrument data quality

Filed 2026-05-20 from Group C planning.

## What

Multiple musicians have factually-wrong `primary_instruments` ordering or
content in the live Aura DB. Examples confirmed 2026-05-20:

- `wikidata:Q107432` (Charles Mingus) → `primaryInstrument: 'piano'`.
  Mingus is famously a **bassist**. Bass is missing or ordered after piano.
- `wikidata:Q298601` (Wes Montgomery) → correct in alt entry
  (`primaryInstrument: 'guitar'`), but the BFF may pick the wrong entry
  when there are multiple node candidates per wikidata id.

## Why this isn't a BFF/worker fix

We own both ends of the pipeline (populator → Aura → BFF). The discipline
is to fix the source, not shim the consumer. A worker-side override map
would silently mask future similar bugs in other musicians (the same
shape as the duplicate-pair issue we previously corrected at the
populator level).

## Suggested fix path

- Inspect populator's instrument-extraction logic (which wikidata field is
  primary? are aliases ordered correctly?)
- Run a one-off correction script over the known-wrong list (Mingus, plus
  any others found by spot-check or by a "instrument != most-frequent
  recorded-on instrument" heuristic)
- Add a populator regression test that asserts Mingus → bass, etc.

## Verification

Once corrected at the populator and reflected in Aura:
- `curl https://musicians.jazzlore.com/api/musicians/search-index | jq '.corpus[] | select(.id == "wikidata:Q107432") | .primaryInstrument'`
  should equal `"bass"` or `"double bass"`.
- The curated home subtitle for Mingus then reads `Bebop · bass` (or
  equivalent), not `Bebop · piano`.
