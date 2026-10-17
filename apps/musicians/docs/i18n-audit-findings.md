# Musicians i18n (French localization) — audit findings & scope recommendation

**Scope:** the `apps/musicians` React app + its Cloudflare Worker BFF, as a localization candidate. **Pilot language:** French. **Product frame (given, not re-litigated):** iOS is the only audience that matters; the web may be localized if it's *simpler*, but it is not a goal; bios may fall back to English; no i18n infra exists today and must be built; any third-party tool must have a *permanent* free tier (not a trial).
**Date:** 2026-06-19. **Author:** automated audit session — investigation only. **No application code was written, no dependency installed, no route changed.** The only file created is this document.

> **Method note (the "context wins" discipline that bit the SEO audit).** Every architectural claim below is checked against the real code with `file:line`, not the design docs. Where one of the brief's hypotheses turned out wrong, it is flagged inline (see §2 — the platform-detection assumption, and §1 — the Category-B refinement). The brief's own posture — "audits can be wrong about architecture" — is taken literally.

---

## 0. TL;DR — the one-paragraph answer

A French **UI shell is cheap, low-risk, and SEO-neutral** — there is *zero* i18n infra today, but the translatable surface is small (~270 chrome + editorial strings) and localizing the **shared React layer** (web inherits for free) is strictly simpler than walling it off to the iOS build. The hard truth is the one the brief predicted: **a musician detail page is ~75–85% English *data* by visible word count** (bio paragraph + dozens of record titles + collaborator names), so UI-only localization yields a "French frame around English content" effect. **Two cheap moves dramatically narrow that gap without touching the database:** (1) translate the code-derived **era** labels and (2) add a small **controlled-vocabulary dictionary** for instruments / genres / nationality (a finite ~100-term set). With those, the only large English block left on screen is the **bio paragraph** — and that is exactly the piece that must wait for **Phase 2**, because localizing the bio is the *only* change that touches the recently-stabilized 12h read-through cache (the cache key has **no locale dimension** — §3 is the risk map). Recommended v1: **UI-only + era + vocab dictionary, shared layer, auto-detect via `navigator.language`, no TMS, `react-i18next`.** Defer bios.

---

## 1. Phase 1 — string inventory (the core of the audit)

### 1.1 No i18n infra exists — confirmed

- **No i18n library anywhere.** `grep` across every `package.json` for `i18next | react-i18next | react-intl | formatjs | lingui | polyglot | globalize` → **0 hits**. No `useTranslation` / `FormattedMessage` / `defineMessages` imports anywhere in `apps/musicians/src`.
- **No locale detection anywhere.** No `navigator.language(s)`, no `Intl.*` locale calls, no `Device.getLanguageCode` in `apps/musicians/src`.
- **No head-management lib** (consistent with the SEO audit) — titles are raw `document.title` effects.
- Every user-visible string is therefore a **bare literal** in TSX/TS, hard-coded in English. Building i18n here is greenfield.

### 1.2 The right taxonomy is five buckets, not two

The brief asks for an A (UI chrome, translatable) vs B (BFF data, not translatable) split. That split is correct but too coarse — and the coarseness is exactly what makes "is it worth it?" hard to answer. The real picture:

| Bucket | What | Translatable? | Where |
|---|---|---|---|
| **A1 — chrome microcopy** | buttons, headings, aria-labels, placeholders, error/waking screens, section labels | ✅ edit code/locale file | `apps/musicians/src/**` literals |
| **A2 — editorial prose (in-repo data)** | journey kickers/subtitles + **143 musician "hooks"** + 12 curated hooks + curated track captions | ✅ but **tone-critical** | `data/curated.ts`, `features/journey/data/{eras,labels}.ts` |
| **B1 — proper nouns (data)** | musician names, album/record titles, track titles, places, label names | ❌ **and shouldn't be** — a French jazz fan expects "Kind of Blue" / "Miles Davis" verbatim | Aura / Wikidata |
| **B2 — free prose (data)** | `bio_summary` — the English-Wikipedia first paragraph | ⚠️ only via the **populator** or a live fetch (see §3) | Aura field, stored |
| **B3 — controlled vocabulary (data)** | instruments, genres (stored lowercased), nationality, record types, roles | ✅ **via a code-side dictionary** — finite set, no DB change | Aura strings, mapped in code |

**Why this matters:** the brief's "Category B is untranslatable English" lumps B1 (which you *want* to leave alone) with B2 (the real problem) and B3 (a finite set you *can* translate in code without touching the database). Splitting them is what turns "half-translated and not worth it" into "mostly-French with one accepted English block." This is the single most decision-relevant finding in the audit.

### 1.3 Category-A inventory (the translatable surface), by area

Approximate distinct-string counts (chrome + editorial), grouped:

| Area | A1 chrome | A2 editorial | Notable strings (verbatim) | Key files |
|---|---|---|---|---|
| Home | ~12 | hero + sub + 3 journey labels/blurbs | "Step into a musician. Follow whoever they played with.", "Twelve to begin with", "Start a journey", "Random jump / Era walk / Label walk", "— A graph database, edited like a museum guide." | `features/home/HomeView.tsx:75-104` |
| Detail | ~18 | — | "Orbit · who they played with most", "size = records · initials = name", "More about {name} →", "Bio not yet written ·", "Listen on Spotify", "Possible duplicate · help us merge", trademark footer | `features/detail/DetailView.tsx:267-317`, `DetailIdentity.tsx:103-164` |
| Status / error | ~14 | 3 variant copy blocks | "The graph is waking up.", "We missed a beat.", "Couldn't load this — you're offline.", "Try again", "Or read offline", "— cached locally from your last visit." | `features/status/WakingState.tsx:48-217` |
| Journey (index + detail) | ~10 | **7 eras + 6 labels × (kicker+h1+subtitle)** + per-entry "{n} to dig into" | "{n} to dig into", "ERA ·", "LABEL ·", "Back to eras/labels"; era subtitles e.g. "America's dance music, before the small-group revolution." | `features/journey/*.tsx`, `data/{eras,labels}.ts` |
| Search / autosuggest | ~6 | — | "Search a musician…", "Musician matches", combobox aria | `features/search/*.tsx`, `features/home/HomeSearchInput.tsx:27-28` |
| Graph (desktop) | ~8 | — | "Node size = records together", "Zoom in/out", "Refit graph", "Toggle layout density", "Loading the collaboration graph" | `features/graph/GraphView.tsx:118-153` |
| Shared components | ~10 | — | "Orbit — who they played with most", "From the same era", "View all {n} records with {name}", "Records with {name}", "Close — …" | `components/{MosaicV4,EraStrip,ConnRow,Attrib}.tsx`, `features/detail/SharedRecordsSheet.tsx` |
| **Editorial hooks (data)** | — | **143** musician hooks (70 era + 60 label + 13 curated) | "Reinvented jazz five times and never looked back.", "Chased one sound so hard it became a kind of prayer." | `data/curated.ts`, `data/{eras,labels}.ts` |

**Rough totals:** **A1 ≈ 90–110 distinct chrome strings**, mostly short. **A2 ≈ 160 editorial strings**, of which the **143 hooks** are individually crafted, tone-bearing one-liners. So the *count* is modest, but the **A2 hooks are where the real translation labor and quality risk live** — not the chrome. (See §6: these carry the "museum-guide voice," the hardest thing to translate well.)

> **Buried-literal traps found (Category A, easy to miss in extraction):** `detailIdentityMeta.ts:34` builds `` `${start}–present` `` — the word **"present"** is a hard-coded English literal inside a template, not a JSX string. `WakingState.tsx:81` stamps "… UTC" via `toISOString()`. Genre capitalization (`capitalizeFirst`) assumes English casing. An extraction pass must catch in-code literals, not just JSX text.

### 1.4 The A-vs-B ratio on a detail page — the decisive number

Take an **enriched** detail page (e.g. Miles Davis — the marquee case, also the SEO long-tail target). Counting **visible words**, not strings:

- **Category A (chrome) actually on screen at once:** header ("Jazzlore · Musicians", "Back", "Search"), "Orbit · who they played with most", "size = records · initials = name", "More about Miles →", "Listen on Spotify", "From the same era", "Records with …", footer trademark line. **≈ 35–45 chrome words.**
- **Category B (English data):**
  - **B2 bio paragraph:** ~60–90 words (the single largest text block; FRONTEND.md:59 = "first paragraph of Wikipedia article, ~300–500 chars").
  - **B1 record titles:** an enriched musician has **dozens** (Miles ≈ 113 records); even the visible strip is 10–40 titles × ~2–3 words = **40–120 words.**
  - **B1 collaborator names:** the orbit + rail show 12–40 names × ~2 words = **24–80 words.**
  - **B3 metaLine:** "Trumpet · Cool · Modal · Fusion · 1926–1991" — instruments + genres are B3; years are numbers.

**Verdict:** an enriched detail page is **~75–85% English data by visible word count.** A naïve UI-only translation therefore *does* produce a "half-translated" page — the brief's worry is **correct and quantified.**

**But the composition matters more than the percentage.** Of that 75–85%:
- **B1 (names, titles) — the majority of the word count — should stay English anyway.** Localizing "Kind of Blue" or "Saxophone Colossus" would be *wrong*, not incomplete. French users expect original proper nouns. So B1 doesn't count against the experience.
- **B3 (instruments / genres / nationality) — small and code-mappable.** Translating these via a dictionary is what makes the *identity line* read French ("Trompette · Cool · Modal · Fusion · 1926–1991").
- **B2 (the bio) is the only block that is both prominent and genuinely English-prose.** It is also the one Aurélien already said may **fall back to English.**

**So the honest framing for the gate decision:** with B1 left alone (correct), B3 dictionary-translated (cheap, no DB), era translated (code, §1.2), and the chrome+editorial in French, a detail page reads as **"French UI + French descriptors + original-language proper nouns + one English bio paragraph."** That is a *defensible* French experience, not a half-translated one — **provided B3 + era are in scope.** Drop B3 and the identity line ("Trumpet · Cool jazz") stays visibly English directly under the French heading, and the half-translated feel is much worse. **Recommendation: B3 + era are not optional polish — they are what makes UI-only worth doing at all.**

---

## 2. Phase 2 — locale detection & the iOS-vs-shared question

### 2.1 Detection: `navigator.language` is the cheapest correct source — confirmed against Capacitor 8.3.4

- **`@capacitor/device` is NOT installed** (only `@capacitor/app@^8.0.0` is — `apps/musicians/package.json:18`). So `Device.getLanguageCode()` would be a **new dependency** — avoid it for the pilot.
- **`navigator.language` works in the Capacitor WKWebView.** A Capacitor iOS app runs a real `WKWebView`, which reports the device's preferred language via `navigator.language` / `navigator.languages` (the WebView inherits the iOS language settings). This needs **zero new deps**, works identically in browser, PWA, and the native shell, and is the conventional SPA approach.
- **Platform discrimination already exists** via `isNativeApp()` (`@jazzlore/ui`, used throughout `useMusicianData.ts`, `DeepLinkHandler.tsx`) if it's ever needed — but for *language* detection it isn't.

> **Brief hypothesis checked:** the brief floated `@capacitor/device` / `Capacitor.getPlatform()` as detection options. Verdict: **not needed and more costly.** `getPlatform()` answers "am I iOS?" (already answered by `isNativeApp()`), not "what language?"; `@capacitor/device` is an un-installed dependency. `navigator.language` is the right tool. Recommended detection chain: **`localStorage` override → `navigator.languages` first FR match → default `en`.**

### 2.2 Shared-layer vs iOS-only — recommend SHARED, with the argument

The brief's hypothesis ("walling localization to the iOS build is *more* work and more fragile; localizing the shared layer is simpler and the web inherits for free") is **correct — confirmed by the architecture.**

- There is **one** React codebase. The iOS app is a Capacitor wrapper that serves a **frozen snapshot of that exact web build** (`make musicians`). There is **no separate iOS string layer** for the main UI — the only native Swift strings live in the widget extension (§7).
- **Walling off to iOS would require** *adding* machinery that doesn't exist: a build-time or runtime gate that loads FR only when `isNativeApp()`, and a guarantee the web build stays English. That's **more** code and a new failure mode (locale state diverging from platform state), for **no benefit** — the snapshot is frozen per release anyway, so "the web might accidentally show French" is not a real risk you're protecting against.
- **Localizing the shared layer** means: detect language once, render the React tree in that language. The native iOS app's WebView reports the French device locale → French UI, automatically. A French *browser* visitor also gets French — which is **harmless** (the web is "indifferent" per the frame; a FR browser getting FR UI is a feature, not a bug) and costs nothing extra.

**Recommendation: localize the shared React layer; let both web and iOS inherit from `navigator.language`.** It is the smaller, simpler, less fragile option, and it satisfies the iOS goal as a side effect.

### 2.3 Is the shared-layer choice SEO-safe? — YES, with one invariant

If the web also renders French UI, does that regress the SEO posture the previous audit stabilized? **No — UI-only client-side localization is SEO-neutral, provided one invariant holds.** Reasoning, checked against the code:

1. **The crawlable SEO surface is the server-injected `<head>`, not the React body.** v1 deliberately ships a JS-hidden body; Google sees per-musician `<title>`, `<meta description>`, OG, canonical, and JSON-LD injected at the edge by `worker/og.ts`. **That injection reads no locale** — it builds English meta from `bio_summary` + `deriveEra` unconditionally (`worker/index.ts:129-139`, `worker/og.ts`). So **the indexed content stays English** regardless of what UI language a browser renders.
2. **No per-locale URLs are introduced.** UI-only localization changes *rendering*, not *routing*. The 30,134 sitemap URLs, canonicals, and robots.txt are untouched. Googlebot sends no `Accept-Language` expectation that would fork content; it gets the one English head per URL it already gets.
3. **The body is JS-rendered and (per the SEO audit) effectively not the indexed surface today** — so even the French body text a FR browser renders doesn't compete with the English head for indexing.

> **The one invariant (write it into the implementation plan):** the **server-side head injection must remain English-only** — it must **never** read `navigator.language` (it can't — it's server code) nor a locale cookie/param. As long as the OG/canonical/JSON-LD path stays locale-blind, **UI-only localization = SEO-neutral.** This is clean *only* for UI-only. The moment bios become locale-dependent (§3), this invariant becomes a live constraint on the OG path, not a free property.

---

## 3. Phase 3 — bio (data) localization: the cache×locale risk map

This is the phase that can break what PR #180 just stabilized. **Document the risk first, then the recommendation.**

### 3.1 Where bios come from — single stored field, no live language switch

- `bio_summary` is **"the first paragraph of the English Wikipedia article"** (`docs/FRONTEND.md:59`), **stored as one field per `:Musician` node** in Aura by the populator. It is **not** fetched live by the Worker and carries **no language parameter** — `detailCypher` simply projects `m{.*}` (`worker/cypher.ts:220`).
- **Coverage is already thin:** `bio_summary` is present on only ~**4%** of all nodes (~1,030 of 26,055), though ~**98.6%** of the 1,045 enriched `wikidata:` nodes have one (`docs/data-audit.md:145-149`). The detail pages users actually land on are the enriched ones, so the bio is prominent *where it appears*.

**Consequence — decisive:** localizing bios is **not** a "thread `?lang=fr` to the source" change, because there *is* no live source in the request path — the bio is a frozen string. Two real options:

- **(P-a) Populator produces FR bios.** The populator (`~/Documents/JazzDBPopulator/`, the sole writer to Aura) fetches French-Wikipedia extracts and stores a second field (e.g. `bio_summary_fr`), with EN as fallback when a FR article is absent. The Worker then selects the field by requested locale. **This is the clean design** and matches "fallback to EN is acceptable" perfectly — French-Wikipedia coverage of mid-century American jazz is partial, so many musicians will simply have no FR bio and fall back. Per the **explicit-projection gotcha** (`apps/musicians/CLAUDE.md`), the new field must be added to `detailCypher`'s projection (note: `bio_summary` rides the `m{.*}` spread today, but a *selected* localized field is cleaner as an explicit projection) **and** the mapper, then proven with the live-Aura smoke.
- **(P-b) Worker fetches FR Wikipedia live per request.** Rejected: adds a per-request external fetch to the CPU-budget-constrained detail path (the very thing Error 1102 punished), defeats the cache, and couples crawl/render to Wikipedia uptime. Don't.

### 3.2 RISK №1 — the read-through cache key has NO locale dimension

This is the headline hazard. Today (`worker/cache.ts:40-57`):

```
CACHE_KEY_ORIGIN = 'https://jazzlore-cache.internal/musician/'
musicianCacheKey(id) = CACHE_KEY_ORIGIN + encodeURIComponent(normalizeMusicianId(id))
```

The key is **the musician id and nothing else** — deliberately independent of the request URL, query string, and headers (that's what lets `?cb=` not bust it and collapses the colon-encoding variants). **The response body is cached for 12h** (`DETAIL_CACHE_TTL`, `worker/env.ts:53`).

**If the JSON `/api/musicians/:id` response becomes locale-dependent (P-a ships and the Worker returns a FR bio for FR requests), then with the current key:**

> The **first** request for a musician populates the 12h entry in whatever language it happened to be. **Every** subsequent request — *any* language — gets that cached body. A French user warms the cache → English users get the French bio for 12h, and vice-versa. Cross-language contamination, per-colo, for 12h, invisible without the `x-jazzlore-cache` header.

**Mitigation (mandatory if bios are localized): add the locale to the cache key.** `musicianCacheKey(id, locale)` → `…/musician/<id>/<locale>`. This is a one-line shape change but it is **load-bearing** and must land **in the same PR** as any locale-dependent BFF response, with a `cache.test.ts` assertion that `en` and `fr` keys differ. Bumping `CACHE_KEY_ORIGIN` (the existing version lever) orphans old entries on deploy — do that too, so no pre-locale entries linger.

### 3.3 RISK №2 — the OG/document path × locale × HTMLRewriter

The OG/document path (`handleMusicianDocument` → `injectOg`) is a **separate, uncached** query (`worker/cache.ts:12-18` is explicit: only the JSON is cached, never the injected HTML — precisely to avoid serving a non-injected variant to a crawler). So there's **no cache-key bug here.** But there is an **SEO-consistency constraint**:

- The OG meta description and the JSON-LD `description` are built from `bio_summary` (`worker/index.ts:136`, `worker/og.ts:32-36,150`). If a localized bio field exists, the OG path **must keep selecting the English one** — the §2.3 invariant. Crawlers and the 30k indexed URLs must stay English (no hreflang/per-locale URLs in this iteration).
- **Net mapping:** `locale × cache` → **fix the JSON key (Risk №1).** `locale × OG/HTMLRewriter` → **pin English in the OG path (no code path reads locale there today; keep it that way).** Both are simple *if stated as explicit invariants up front*; both are silent foot-guns if bios are localized without naming them.

### 3.4 Native-app interaction (one extra wrinkle)

The native iOS shell calls the **absolute origin** `https://musicians.jazzlore.com/api/...` via `CapacitorHttp` (`useMusicianData.ts`), i.e. the **same Worker and same `caches.default`** as the web. So a French iOS user and an English web user share one cache. With locale in the key (Risk №1 fix) this is fine; without it, the contamination crosses web↔native too. No additional mechanism needed beyond the key fix.

### 3.5 Recommendation: defer bios to Phase 2

Because (a) EN fallback is explicitly acceptable, (b) bio localization requires **populator work** (P-a) *plus* the **cache-key change** (Risk №1) *plus* an OG invariant (Risk №2) — i.e. it touches the populator, the BFF, and the just-stabilized cache — and (c) the UI-only + era + B3-dictionary path already delivers a coherent French experience with the bio as the single accepted English block: **ship UI-only first; treat bios as a separate, later, well-gated batch.** The bio is the *one* piece whose localization can re-destabilize the graph-unreachable fix, so it deserves its own PR with its own smoke + cache test, not a rider on the UI work.

---

## 4. Phase 4 — SEO / sitemap / canonical / OG non-regression

**UI-only localization touches none of the SEO surface** — confirmed by the §2.3 reasoning and the file map:

| SEO artifact | Source | Touched by UI-only i18n? |
|---|---|---|
| `sitemap.xml` (30,134 URLs) | `worker/index.ts:179` → `buildSitemap` | ❌ no |
| `robots.txt` | static asset | ❌ no |
| `<link rel=canonical>` | `worker/og.ts:59` | ❌ no |
| `<title>` / `<meta description>` / OG / Twitter | `worker/og.ts` (English) | ❌ no — stays English (the invariant) |
| JSON-LD Person/MusicGroup + `sameAs` | `worker/og.ts:136` | ❌ no |

**Explicitly OUT of scope for this iteration (flag as backlog, do not imply):**
- **Per-locale URLs (`/fr/...`) and `hreflang`.** This is the *real* SEO-i18n project: forked routes, `hreflang` reciprocity, per-locale sitemaps, localized OG/canonical, and (to be worth anything) a crawlable French *body*. It is a large, separate effort and is **not** required for — and must not be entangled with — a French *UI*. If French organic search ever becomes a goal, file it as its own initiative. For now: **UI-only changes rendering, not URLs → SEO-neutral.**

---

## 5. Phase 5 — i18n library & the free-tier (TMS) question

### 5.1 The free-tier constraint does not apply to the runtime library

The runtime i18n libraries (`react-i18next`, `react-intl`/FormatJS, Lingui) are **open-source and free forever** — the "permanent free tier" constraint is about a **TMS** (translation-management SaaS: Lokalise, Crowdin, Phrase, Tolgee, Weblate, Localazy), not the library.

### 5.2 Library recommendation: `react-i18next` (with a lean alternative)

For a Vite + React 19 SPA, one pilot locale, a ≤100 KB-gz initial-JS budget, and an explicit *learning* goal (`apps/musicians/CLAUDE.md` — "lean toward learn modern practice"):

| Option | Fit | Note |
|---|---|---|
| **`react-i18next` (recommended)** | Industry-standard, biggest ecosystem, best docs, most transferable skill. Namespaces, interpolation, plurals, lazy locale loading. | ~15–20 KB gz; lazy-load the FR bundle so the EN default doesn't pay for it. Highest learning value. |
| **Lingui (lean alternative)** | Smallest runtime, compile-time message extraction, ICU, great DX with macros. | Pick this if the bundle budget is tight or you prefer compile-time extraction. |
| **Hand-rolled `t()` over JSON + context (zero-dep floor)** | Genuinely viable at ~270 strings / 2 locales. No dep, full control. | The "no over-engineering" choice. Costs you plurals/ICU/extraction tooling you'd then reinvent. Defensible but lower learning value. |
| react-intl / FormatJS | Fine; ICU-first. | No decisive advantage here over react-i18next for this scale. |

**Recommendation: `react-i18next`**, lazy-loading the FR namespace, EN as the default/fallback. It's the conventional modern choice, the most useful thing to learn, and fits the budget. *(At implementation time, verify the current setup against Context7 docs per the repo's external-library rule — this audit pins the choice, not the API.)*

### 5.3 TMS verdict: NOT needed for the pilot

For **one** added language with a **native-French reviewer (Aurélien himself)**, a TMS is **overkill**: **JSON locale files in the repo + manual translation + Aurélien's review** is zero-third-party, zero-cost, and keeps the tone under his control — which is the actual quality lever (§6). Recommendation: **`locales/{en,fr}/*.json` in the repo, no SaaS.**

> **Signal, don't impose:** the repo is **public + MIT**, which qualifies it for the **OSS free plans** several TMS offer (Crowdin, Weblate, Tolgee, Localazy) *if* you later add many languages or outside contributors. Weblate and Tolgee are also self-hostable open source. None of that is needed now — note it as a future option, not a v1 dependency.

### 5.4 Recommended workflow

1. **Extract** A1 + A2 strings to `locales/en/*.json` (split namespaces: `common`, `home`, `detail`, `status`, `journey`). Catch the buried in-code literals from §1.3.
2. **Add the B3 dictionary** as code-side maps (`instruments.fr.json`, `genres.fr.json`, `nationality.fr.json`, `era.fr.json`) — keyed by the canonical English DB string, EN passthrough on a miss.
3. **First-pass FR translation** (machine or hand) into `locales/fr/*.json`.
4. **Human review by Aurélien** — the load-bearing quality step, *especially* the 143 editorial hooks and the museum-guide voice (§6). His native ear is the differentiator that keeps "No accounts. No feed. No noise." from going flat.
5. Detect via `navigator.languages` (+ a manual override — see the switcher gate in §8).

---

## 6. Phase 6 — French layout & tone traps (list only; nothing corrected)

French runs **15–30% longer** than English. Tight zones to watch (no fixes applied — vigilance list):

- **Header brand row** `Jazzlore · Musicians` → `Musiciens` (fine, ~same length) — but the detail header packs brand + Back + crumb + Search + Share + Install + Theme into one row; any longer label there risks wrapping on small phones (`DetailView.tsx:198-259`).
- **Journey tiles** `Random jump / Era walk / Label walk` → `Saut aléatoire / Parcours d'époque / Parcours de label` — **notably longer**; the 3-up tile grid (`HomeView.tsx:88-98`) is the highest layout-break risk. Check at 320–360px.
- **ALL-CAPS kickers** (`— A graph database, edited like a museum guide.`, era kickers like `— LATE 1920s INTO THE 40s · BIG BANDS RULE THE NIGHT`) — caps + French length + letter-spacing overflow easily.
- **Buttons:** "Listen on Spotify" → "Écouter sur Spotify" (ok); "Try again" → "Réessayer" (ok); "More about {name} →" → "En savoir plus sur {name} →" (longer — the inline bio teaser link).
- **Legends / mono microcopy:** "size = records · initials = name", "Node size = records together" — terse English idioms that don't translate literally; need a *rewrite*, not a word-swap.
- **Hard-coded literals (§1.3):** `–present` → `–présent`/`–aujourd'hui`; UTC timestamp formatting.
- **Numbers / plurals:** "{n} to dig into", "View all {n} records with {name}", "CURATED · {n}" — French plural rules + the space-before-`·`/`:` typographic convention (French uses a thin space before `: ; ! ?`). i18n plural handling matters here.
- **Tone (the real risk, not length):** the **143 editorial hooks** + the home/journey voice are *literary*, not functional ("Chased one sound so hard it became a kind of prayer."). A flat literal translation kills them. This is precisely where Aurélien's native review (§5.4 step 4) is the quality gate — treat the hooks as **transcreation**, not translation.

---

## 7. Widget (native Swift) — separate & optional

The iOS "Musician of the Day" widget (`MusicianWidget` target, **jazzlore-ios** repo) is **hand-coded Swift with hard-coded English chrome** per Aurélien. It is **out of this repo** and **not** part of the React surface. If localized, it would use a **String Catalog (`.xcstrings`)** in the iOS project — standard, free, native — for its handful of chrome strings (its musician *data* is bundled English from the build-time generator and would follow the same B1/B2 rules). **Treat as a separate optional yes/no gate (§8), not part of the core web-app i18n.** Low surface, low effort, but a different codebase and toolchain.

---

## 8. RECOMMENDATION — scope & the gated choices for Aurélien

### 8.1 Recommended v1 perimeter

**French UI shell, shared React layer, auto-detected, no bios, no TMS.** Concretely:

1. **Translate A1 (chrome) + A2 (editorial, incl. the 143 hooks)** — `react-i18next`, `locales/{en,fr}/*.json`, lazy FR bundle, EN fallback.
2. **Translate B3 (instruments / genres / nationality) + era** via code-side dictionaries — *this is what makes UI-only worth doing* (§1.4); no DB change.
3. **Leave B1 (names, titles) English** — correct, not a gap.
4. **Defer B2 (bios) to a separate, later, gated batch** (§3) — EN bio is the one accepted English block in v1.
5. **Detect via `navigator.languages`** + a `localStorage` manual override.
6. **Hold the SEO invariant:** the server head-injection path stays English-only (§2.3, §4). UI-only = SEO-neutral.
7. **Cache:** **no change needed for v1** (UI-only doesn't make the BFF response locale-dependent → the §3.2 risk is *not yet live*). The locale-in-key change lands **with** the bio batch, not before.

This delivers a coherent French app for iOS (and, for free, FR browsers), low-risk, SEO-neutral, no third party, no cache change.

### 8.2 The gates — your call (each is genuinely a decision, not a default)

| # | Gate | Options | Audit's lean |
|---|---|---|---|
| **G1** | **Depth** | (a) UI-only **+ era + B3 vocab** · (b) UI-only chrome **only** · (c) UI + bios | **(a)** — (b) reads visibly half-translated on the identity line; (c) pulls in populator + cache risk. Do (a) now, (c) later. |
| **G2** | **Bios** | now · **deferred (Phase 2)** · never (always EN) | **Deferred** — needs populator FR field + the cache-key fix (Risk №1) + OG English-pin (Risk №2); EN fallback is acceptable, so it's safe to wait. |
| **G3** | **Web vs iOS** | **shared layer (web inherits)** · wall off to iOS | **Shared** — strictly less code, less fragile, satisfies iOS as a side effect (§2.2). |
| **G4** | **Library** | **react-i18next** · Lingui · hand-rolled `t()` | **react-i18next** — standard, best learning value, fits budget; Lingui if bundle-tight. |
| **G5** | **TMS** | **none (in-repo JSON)** · OSS-free TMS later | **None** — 1 language + native reviewer; note the public-MIT OSS-plan eligibility for later. |
| **G6** | **Language switcher** | **auto-detect only** · auto + manual toggle | **Auto + a small manual override** (some FR users prefer English UIs; cheap to add, sets up future locales). |
| **G7** | **Widget (Swift)** | localize · **skip for v1** | **Skip for v1** — separate repo/toolchain (`.xcstrings`), tiny surface; revisit after the web app ships FR. |

### 8.3 Connected workstream (no code — don't forget)

**App Store Connect listing localization** (French subtitle, description, keywords) is a **separate, code-free** task in ASC. It is worth doing alongside this — it also satisfies Apple's "localization" featuring signal, arguably more visibly than in-app strings. **Out of scope for this audit; flagged so it isn't lost.**

---

## 9. Where the brief's hypotheses landed

| Brief hypothesis | Verdict |
|---|---|
| "No native iOS string layer for the main UI; the strings are React literals." | ✅ **Confirmed.** Only the widget (separate repo) is native Swift. |
| "Walling localization to iOS is more work/fragile; shared layer is simpler, web inherits free." | ✅ **Confirmed** by the single-codebase + frozen-snapshot architecture (§2.2). |
| "Cache key is per-id; a locale-dependent response would contaminate across languages." | ✅ **Confirmed and mapped** (§3.2) — but note it's **not yet a live risk** under UI-only; it activates only with bios. |
| "Category B is untranslatable English data." | ⚠️ **Refined.** B splits into B1 (leave English — correct), B2 (bio — the real gap, deferrable), B3 (finite, *code-translatable* without the DB). The refinement is what makes UI-only worthwhile (§1.2, §1.4). |
| Detection via `@capacitor/device` / `getPlatform()`. | ⚠️ **Bettered.** `@capacitor/device` isn't installed; `navigator.language` in the WebView is zero-dep and sufficient (§2.1). |
| "A detail page may be ~80% English data → half-translated effect." | ✅ **Confirmed & quantified** (~75–85% by word count), **with the mitigation** that most of it is proper nouns that *should* stay English, leaving the bio as the one real gap (§1.4). |

---

*No application code was changed. This document is the sole deliverable. Decisions G1–G7 are Aurélien's; an implementation session should follow on this basis.*
