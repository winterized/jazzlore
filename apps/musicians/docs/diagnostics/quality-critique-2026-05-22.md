# Quality critique — musicians.jazzlore.com (2026-05-22)

A read-only product critique, written against the standard of "the best version of this product that could possibly exist" — not against the v1 design spec. Explicit license to critique the design decisions themselves. Ranked by impact on the core promise (a casual listener comes away with new musicians they want to hear), not by ease of fix.

---

## Headline

**The site is two products in one shell, and they're held to different standards.** Inside the curated rails — the home 12, the era cards, the label cards, the orbit of a famous musician — Jazzlore looks and reads like a museum guide. The typography is considered, the copywriting is good prose, the gallery framing is dignified. Off the rails, even one click into "Random Jump" or a hop past a famous musician's top-10 collaborators, the product becomes a database with the placeholders showing — empty card tiles, two-letter monograms, missing bios, a "1911–present" lifespan on a man who died in 1985.

For a casual-listener discovery tool, that's the wrong fall-off curve. The musicians you've heard of are beautifully presented; the discoveries you're supposed to make are stubs. Discovery is exactly where the bar should be higher.

The biggest single risk to the _core_ promise is **data sparseness behind the curtain**. The biggest single risk to the _emotional_ promise is that **the product never lets you HEAR anyone** — it makes you leave to Spotify or Apple Music with a search query, not a track.

---

## Methodology

Explored the live site at https://musicians.jazzlore.com on 2026-05-22 using the Playwright MCP browser, no code changes. Mobile viewport 390×844 first, then desktop 1440×900. Walked the surfaces a casual user would actually touch:

- Home grid → Miles Davis detail → Paul Chambers (famous → famous-but-unknown)
- Random Jump (landed on Big Joe Turner)
- Era walk → Bebop landing → musician card grid
- Label walk → Blue Note landing
- Desktop graph panel on Miles Davis
- Search probe with "kind of blue"

Screenshots captured under `.playwright-mcp/` for cross-reference (`musicians-home-mobile.jpeg`, `miles-detail-mobile.jpeg`, `chambers-mobile.jpeg`, `random-jump-mobile.jpeg`, `era-mobile.jpeg`, `era-bebop-mobile.jpeg`, `label-landing-desktop.jpeg`, `label-blue-note-desktop.jpeg`, `home-desktop.jpeg`, `home-desktop-full.jpeg`, `miles-desktop-above-fold.jpeg`, `miles-desktop-full.jpeg`, `miles-desktop-scrolled-bottom.jpeg`).

Tags below: **[Frontend]** = component / interaction work; **[Data/Content]** = editorial / data backfill / image processing; **[Design rethink]** = the affordance itself is wrong; **[Product scope]** = needs a scope decision (was deferred or not contemplated).

---

## Tier 1 — kills the core promise

### 1. Random Jump lands you on a graveyard of stubs

**[Data/Content + Product scope]**

The "Random jump · Drop into any musician in the graph" tile is one of three top-level "Start a Journey" affordances on the home page — visually equal-weight with Era walk and Label walk. A single trial landed me on Big Joe Turner:

- No portrait — "BT" monogram inside an italic apology ("No portrait on file — Wikimedia Commons request pending.")
- `· BIO NOT YET WRITTEN ·  We don't yet have a biographical summary for Big Joe Turner.`
- Lifespan reads `1911–present` — he died in 1985. Death date data is silently absent.
- Of his 14 visible orbit nodes, only 4 have photos. The rest are two-letter monograms.
- One orbit label parses to `B(` because the source name is "Bobby Thompson (19" — string truncation collides with the initials formatter.
- Only 4 records on the page.

Random Jump is the riskiest path on the site by design (random target → uneven data coverage). What it surfaces in failure mode is _worse than not having it_: it teaches the user "this site is half-built." Casual users don't have the model "oh, this is a long-tail data issue, the famous people will look better" — they conclude "this is an unfinished product" and bounce.

**Why this matters most**: it's offered to first-time visitors as a primary CTA, before they've learned which surfaces are polished and which aren't.

The higher-ceiling version: a curated random pool (drawn from the ~200 musicians with full data) — or rebrand the affordance as "Surprise me from the curated 12" until coverage justifies the open graph.

### 2. You can't search for an album

**[Frontend + Product scope]**

Typed "kind of blue" into the home search. Response: `No matches — try fewer letters or a different spelling.`

The casual listener's mental index is **albums and tracks** (Kind of Blue, A Love Supreme, Blue Train, Maiden Voyage), not musicians. Search-by-musician-name is the engineer's mental model — the schema's natural key. If a user only owns one jazz record and types its name, the product should resolve to the bandleader (or to a disambiguation if shared).

This is the most direct on-ramp from "I like this one record" to "I want to hear who else." Currently it's a dead end.

### 3. There's no audio anywhere

**[Product scope]**

The product's stated win condition is: the user comes away with new musicians they _want to hear_. Currently the only way to hear anyone is to leave the site. The "Listen on Spotify" button opens a _search_ for the artist's name in Spotify — no specific track, no representative cut, no curated "if you've never heard them, start here."

A 15-second preview on each card — even Spotify's preview-URL API — would change the experience category. Right now the product is an elegant Wikipedia browser for jazz. With even minimal audio it becomes a tasting menu — the casual user can sample 12 trumpeters in 3 minutes and save the ones that land.

The spec explicitly excluded audio for v1. That decision is the single biggest ceiling on the product's ability to deliver its named promise. Everything else in this critique sits below this one absence.

### 4. The home page treats every musician like a database row

**[Design rethink + Data/Content]**

Mobile: the 12 portraits are stacked vertically. One per ~600px viewport. Miles + half of Coltrane fit in one screen. To skim all 12 you scroll 6 viewports.

Desktop (1440px): exactly the same stack, rendered 2-column with each portrait full-bleed huge. Same problem. No overview. No gallery feel. No "skim all 12 in one glance" — which is precisely what a museum entrance lets you do.

For a casual user who doesn't know 9 of the 12 names, "scroll past Miles to find someone interesting" is the worst affordance. A casual visitor wants to _see all the faces_, pick one whose face draws them in, and tap. The current layout forces serial discovery through a wall of strangers, where Miles and Coltrane absorb 90% of the clicks because they're the only ones you can see without scrolling.

A dense gallery (3×4 or 4×3 grid, smaller portraits, hook-line on hover or below the photo) would surface the unknowns. The hero treatment is reserved for one card — make it Miles. The other 11 should pull weight as discovery seeds.

---

## Tier 2 — undermines the emotional promise

### 5. Ghost portraits turn the gallery into empty frames

**[Data/Content + Frontend]**

The site has more empty-feeling cards than the "too few photos" hypothesis predicted. Three failure modes blend together:

- **Monogram cards** — e.g., Bobby Timmons on the home grid, Dexter Gordon and Fats Navarro on the Bebop landing, Hank Mobley on Blue Note. Honest about the missing photo but visually deflating.
- **Near-invisible dark photos** — Thelonious Monk and Charles Mingus on the home grid render as near-empty purple/dark gradients. The photo IS present and attribution is rendered — but on the dark theme, with no contrast lift or vignette, the image is invisible. Monk repeats this on the Bebop landing.
- **Completely empty dark tiles** — Andrew Hill and Bobby Hutcherson on Blue Note are dark voids with name labels.

Approximate count across curated surfaces (home 12, Bebop 10, Blue Note 10): roughly **25–30% of cards fail to deliver a "person in a photo" feeling**. On a gallery whose pitch is "museum guide," this is the gap between museum and warehouse.

The dark-image problem is _not_ a Wikimedia limitation — those source images do contain visual content. A subtle filter pass (brightness lift on detected dark photos, soft vignette, light box behind low-luminance images) would recover most of these without any new portraits sourced. The hardest cases (truly missing photos) need an editorial decision: source one, illustrate, or rotate them off the curated lists.

This is the observation you suspected. It's confirmed and more pervasive than just "too few photos" — the _appearance_ of empty is the bigger story than the literal absence.

### 6. The detail page body is dry; the story is hidden behind a click

**[Frontend + Data/Content]**

On Paul Chambers's detail page, the visible bio reads: _"Paul Laurence Dunbar Chambers Jr."_ That's the entire bio in the page body. The actual 5-sentence biographical summary ("A fixture of rhythm sections during the 1950s and 1960s… anchor of trumpeter Miles Davis's 'first great quintet'…") lives inside a modal one click away, behind "More about Paul →".

The page surface tells the casual user "there is no story here." It's tags + name + listen buttons + 16 connection rows + 153 record covers. Dense, but database-shaped. The museum-guide voice you nailed on the home 12 and on the era/label landings is completely absent on the detail page — and the detail page is where the user actually spends time.

Compounding this: the hand-written hook lines ("Reinvented jazz five times and never looked back", "The most lyrical touch the piano trio ever knew") only exist for the curated 12, sourced from `apps/musicians/src/data/curated.ts`. Every one of the other ~3,000 musicians on the site has no editorial voice. The product's literary register collapses to "name + instrument" the moment you leave the curated rail.

The fix isn't necessarily LLM bios for 3,000 people — it's making the lead-paragraph treatment of the detail page do real work. Even the Wikipedia first sentence + one anecdote inline would change the page from database row to mini-biography.

### 7. "From the same era" is the orphan section

**[Frontend + Data/Content]**

The most valuable serendipity affordance on the detail page — "contemporaries who weren't in their bands — a way to wander sideways" — is rendered as initials-only tiles. No photos. No hook lines. Smaller than the orbit grid above it.

This is exactly where wandering should feel _most_ rewarding (it's the surface that breaks you out of "Miles's band → Miles's band → Miles's band" loops), and instead it visually signals "lower-tier content." On Paul Chambers's page, "From the same era" shows Sun Ra, Andrew Hill, Buddy Rich, Art Tatum, Marian McPartland, Lou Donaldson — extraordinarily varied and interesting, all rendered as monograms. The opportunity here is enormous and the current treatment buries it.

---

## Tier 3 — the graph view, as an idea

### 8. The graph is engineer-candy, not a casual-user tool

**[Design rethink]**

On Miles's desktop page the graph is a 960×900 SVG containing **434 collaborator nodes, 434 edges, and 1067 text labels** — every relationship rendered at once. Visually it's striking: a colored nebula with Miles at the center, line thickness encoding records-together, a sticky right panel that remains as the left column scrolls.

As a navigation tool, it does **nothing the lists below it don't do better**:

- Clicking a node navigates to that musician's page. So does clicking the orbit grid. So does clicking a "Where to go from here" row. So does the "Show all 434 collaborators" button.
- The lists give you **more context** for each collaborator (instrument, most-collaborated album with year, "+N more"). The graph gives you a colored circle, a two-letter initial, and a name fragment overlapping with five other name fragments.
- The lists are **editorially confident** (top 16 ranked by records-together). The graph dumps all 434 at equal visual priority near the center and lets gravity sort them — every node says "I am equally important," which is the opposite of what a curator does.
- The names are **unreadable in the dense middle ring**. The visible information is "this person has a lot of friends," which is not actionable.

For a casual user, "show me 434 names at once" is anti-discovery. It asks the visitor — who by definition doesn't know any of these people — to pick somewhere to look in a fog. The lists make confident editorial choices on their behalf; the graph abdicates that choice.

**The graph is earning its place as desktop atmosphere, not as a discovery surface.** It's a beautiful first-impression moment. But if you removed it tomorrow and made the desktop layout a wider single-column with the orbit grid larger and the connection list richer, the casual user's discovery success rate would go up, not down.

**Higher-ceiling alternatives** the casual-listener lens points to:

- **Career timeline.** Horizontal axis = years of the musician's active career. Each collaborator plotted at the year of their most prolific album together, instrument-shaped icon. Story emerges: who joined Miles in '55, who replaced them in '63, who came in for fusion. This tells you something only this product could.
- **Instrument constellation.** Group nodes by instrument as visual clusters (saxophonists left, pianists center, drummers right). Within each cluster, top-5 with photos, the rest collapsed. A casual user can say "let me explore the pianists Miles played with."
- **Records-together-shaped.** Show only the 30 collaborators with the strongest ties, large enough to read, with the connecting album listed on the edge. The data already supports this — the visualization just trusts the user too little.

Any of these would tell the casual user a _story_. The current graph tells them "Miles had a lot of friends," which they already knew.

### 9. No filter, no focus, no relationship type

**[Frontend + Design rethink]**

In both the orbit and the graph, every relationship is the same edge type: "appeared on records together." There's no distinction between "spent 8 years in his quintet" and "appeared on one date in 1956." Line thickness encodes count, but it's not legible at scale and not exposed in the list.

The casual user can't ask "show me only sax players" or "only the '50s lineup" or "people he made more than 5 records with." They get the full 434 or the top 16 — no middle ground. The spec explicitly defers filters as "casual users tap, they don't filter," but that confuses two things: a casual user won't apply a filter chip, but a casual user _will_ tap a header that says "Just the sax players →" if you offer it editorially.

---

## Tier 4 — what's missing entirely (absences, not bugs)

### 10. No "where to start listening"

**[Product scope + Data/Content]**

"Listen on Spotify" opens `open.spotify.com/search/<name>`. Not a track. Not a representative cut. Not a 3-track tasting playlist. Not the user's hand into the river — just a search box on someone else's site.

A hand-picked "first track" per musician — with a deep-link to the Spotify track URI and the Apple Music equivalent — would convert "I'm curious" into "I'm hearing this now" in one tap. For the curated 12, this could be in `curated.ts` tomorrow. For the next 200, it's an editorial pass. For the long tail, fall back to the current search behavior.

This is the cheapest possible delta with the largest possible impact on the named win condition.

### 11. No real album covers; the records list is hundreds of dark gradients

**[Data/Content]**

"Records they shaped" lists 113 records for Miles, 153 for Paul Chambers. Every single one is a colored gradient placeholder with title + label + year text. Real album covers are absent.

Blue Note famously _is_ its cover art. The Label walk landing copywriting names Reid Miles ("a sound, a font, a Reid Miles cover") — but a Reid Miles cover never appears anywhere on the site. The records section is mostly visual noise as a result, and the records-shaped tease in the label copy reads like a writing exercise rather than a description of what you're about to see.

This is data work, not design work. Cover-art sourcing (MusicBrainz Cover Art Archive, Wikimedia, Discogs) is non-trivial at this scale but well-trodden.

### 12. No "today" / no return value

**[Product scope]**

No reason to come back tomorrow. No musician of the day. No rotating featured era. No "you visited Coltrane last week — here's the _Crescent_ track you didn't open yet." The product is single-session by design — the visitor either finds something they love in one sitting or they don't return.

For a discovery tool whose value compounds (the second visit teaches you what you missed the first time, the third visit shows you a connection you didn't see), this is a structural ceiling.

### 13. No teaching for the actual beginner

**[Product scope + Data/Content]**

The hook lines on the curated 12 are gorgeous but assume knowledge:

- "Found the church in hard bop and made it swing" — requires knowing what hard bop is and where "the church" came from.
- "Wrote the angles everyone else has been rounding off since" — requires knowing Monk's harmonic vocabulary.
- "Made the alto sound like a man laughing and weeping at once" — requires having heard a few alto players.

The era landing one-liners DO teach ("Bebop · the small-group revolution led by Bird and Diz"), but they're not linked back to the musicians. Click Bobby Timmons and nothing tells you "← this is hard bop, the era you just read about on the Era walk." A small "in the lineage of: hard bop" link badge on each detail page, linking to the era's landing, would make the site's two registers (poetic + pedagogical) talk to each other.

---

## Tier 5 — over-built / under-built

### 14. Four parallel views of the same data

**[Frontend]**

On a single Miles Davis page:

- **Orbit grid** (top 14 portraits, sized by record count, on every viewport)
- **Where to go from here** (top 16 rows with portrait + instrument + most-collaborated album, on every viewport)
- **Show all 434 collaborators** (expandable list, on every viewport)
- **Graph** (all 434 nodes, on desktop only)

The casual user is told who Miles's collaborators were **four times**, in four shapes, with diminishing returns. The orbit and the connection list cover ~95% of the editorial value. The "show all" overflow and the graph are bonuses with no clear separate role.

The product chose maximalism over editorial restraint. A tighter version would be: a richer orbit (top 20 with hook lines), a single "explore all" affordance, and the graph kept as desktop atmosphere or rethought per Tier 3.

### 15. Non-anchor navigation breaks browser conventions

**[Frontend]**

The orbit tiles render as `<button role="link">`. The "Where to go from here" rows render as `<div role="link" tabindex="0">`. Neither is an `<a href>`.

Consequences:

- Cmd-click / Ctrl-click to open in a new tab — doesn't work.
- Right-click → "Open in a new tab" — doesn't work.
- "Copy link address" — doesn't work.
- Browser back behavior after a deep wander — works, but only because React Router catches programmatic navigation; a few wanders in I saw nav stutter where my back button didn't return cleanly.

For an exploration tool where you specifically _want_ people to fork their browsing (open Coltrane in a new tab while reading about Miles), this is the wrong primitive. The keyboard / screen-reader story works because `role="link"` is honored, but the mouse story is broken. Real anchors with `href="/musicians/<id>"` would fix this with no behavior change to the existing handlers.

### 16. The bio modal is a discoverability bug

**[Frontend]**

The lead-paragraph slot on the detail page is occupied by the legal name only ("Paul Laurence Dunbar Chambers Jr."). The actual biographical summary is in a modal labeled "More about Paul →". The "More about" link is small, low-contrast, and reads as auxiliary metadata rather than "the content is here."

A casual user scanning the page sees: name, tags, listen, list, list, list. They don't see "there's a story here." A 1–2 line excerpt inline ("Anchor of Miles Davis's first great quintet, 1955–63") with the rest expanding inline would change the page from database row to mini-biography without restructuring anything else.

### 17. The Random / Era / Label triplet feels equal-weight but isn't

**[Design rethink]**

The "Start a Journey" row offers three tiles in a single horizontal strip, visually equal-weight:

- **Random jump** — content lottery, currently lands ~50% of the time on a stub
- **Era walk** — gorgeous, editorial, curated rosters of 10 musicians per era
- **Label walk** — gorgeous, editorial, curated rosters of 10 musicians per label

Era and Label are honest about what they are: editorial entrances. Random is dishonest — it implies "any of our musicians is interesting enough to start with," which isn't true at current data coverage. Until the long tail is properly populated, either remove Random or constrain its target pool to musicians with bios + portraits (a "Surprise me" affordance that draws from a polished subset).

---

## Closing — the calls you asked for

- **The graph is the wrong idea for this audience.** It's beautiful as desktop atmosphere; as a navigation tool it does nothing the lists below it don't do better. Keep it as ambient, or rethink the metaphor toward something that teaches (career timeline, instrument constellation). Don't believe it's earning its place as a primary discovery surface — the casual user gets nothing from it that the orbit grid doesn't give them with more clarity.

- **The fall-off curve is inverted.** The site rewards "famous → famous" wandering and punishes "famous → curious" wandering. For a casual-listener discovery tool, that's exactly backwards. Coverage gaps cluster precisely where exploration is supposed to be most rewarding.

- **Audio is the missing organ.** The product cannot deliver its stated promise without letting the user HEAR. Everything else in this document — bios, portraits, search, the graph — sits below this one absence. The cheapest win available is hand-picked first-tracks for the curated 12, deep-linked into Spotify and Apple Music. The bigger win is in-page preview audio.

- **Data coverage is the design constraint, dressed up as a design.** The visual language was designed for the ~30 musicians with full data and the ~12 with hand-curated voice. Then the doors opened on a ~3,000-musician graph. Every place where coverage breaks — Random Jump, "From the same era," off-curation detail pages, the records list — the museum guide disappears and the database shows. The "best version of this product" is either smaller (radically limit to the polished set and earn the museum framing throughout) or it's much larger (close the data gap so the gallery framing holds across the whole graph). The current shape is between those two and pays the cost of being neither.

The single highest-leverage move from the casual-listener lens is **audio + a hand-picked first track per musician**. The single highest-leverage move from the emotional-quality lens is **a contrast/vignette pass on dark portraits** (cheap, recovers most of the "empty gallery" feeling without sourcing new images). The single highest-leverage move from the structural-integrity lens is **either remove Random Jump or constrain its pool** (it's actively teaching first-time visitors the wrong thing about the site).
