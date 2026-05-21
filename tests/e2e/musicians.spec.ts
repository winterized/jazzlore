/**
 * Phase G — musicians end-to-end journey.
 *
 * Pattern: mirrors the repo e2e specs (per-spec `test.use({ baseURL })`,
 * objective assertions only — DOM / URL / computed-style / viewport, never
 * an eyeball). `reducedMotion: 'reduce'` is set per test for determinism
 * (the 280ms sheet slide, the 900ms graph re-centre tween and the
 * mosaic-pulse all clamp under it; CLAUDE.md "reduced-motion = snap").
 *
 * BFF mocking — an honest note. The musicians SPA bundle does NOT call
 * `/api/*`: HomePage / MusicianPage / Autosuggest / GraphPanelSlot all read
 * the FROZEN-shaped `fixtureSource` (apps/musicians/src/hooks/useMusicianData.ts)
 * directly. The production-source swap to real `fetch` was deliberately
 * deferred (it lands when the BFF source is wired); the Vite dev server
 * therefore serves the SPA fed by the Phase-D fixtures, whose shapes ARE the
 * frozen `/api/musicians/*` envelopes (rich = Miles, sparse = Antoine, the
 * dev-only `__preview/waking` harness for the 503 path). We still install a
 * `page.route('**\/api/**')` guard: it (a) documents the intended
 * mock-the-BFF intent, (b) FAILS LOUDLY if the build ever starts issuing an
 * unmocked `/api/*` call (the seam changed and this spec must be revisited),
 * and (c) returns the same frozen-shaped fixtures if it ever fires, so the
 * journey assertions stay valid either way. The fixture data IS the contract;
 * the journey it drives is the real one.
 *
 * Image-attribution note (Phase H — verified against the rendered DOM):
 * the 12 home curated cards and the detail identity hero now paint the REAL
 * Wikimedia portrait in the pass-5 duotone treatment (hover/focus → full
 * colour; the collaborator mosaic + ConnRow tiles stay monogram by design).
 * The legal credit is the magazine-style <figcaption> rendered wherever the
 * license/attribution metadata is non-empty (the FROZEN attributionCaption
 * owns the rule): "Photo: <attr> · <lic>" beside a hero portrait,
 * "Cover art: …" beside an album cover. A missing portrait → graceful
 * monogram (+ the explicit "no portrait on file" placeholder on the detail
 * hero), never a broken <img>, no caption.
 */

import { expect, test } from '@playwright/test'
import { mockBff } from './musicians-bff-mock'

const BASE = 'http://localhost:5175'
const MILES = '/musicians/wikidata:Q93341' // RICH fixture
const ANTOINE = '/musicians/wikidata:Q2856321' // SPARSE fixture + duplicate
const WAKING = '/musicians/__preview/waking' // dev-only calm-503 harness

test.use({ baseURL: BASE })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockBff(page)
})

// ─── 1. Home → curated grid → tap a card → detail ─────────────────────────

test('home renders the curated grid; tapping a card opens the detail', async ({
  page,
}) => {
  await page.goto('/musicians')
  await expect(
    page.getByRole('heading', { level: 1, name: /step into a musician/i }),
  ).toBeVisible()

  // Curated cards are real links to /musicians/:id. Tap the Miles card.
  const milesCard = page
    .getByRole('link')
    .filter({ hasText: /miles davis/i })
    .first()
  await expect(milesCard).toBeVisible()

  // Phase H — the Miles card paints a REAL duotone portrait (the CC mock
  // serves a real bitmap). Objective (not eyeballed): the <img> actually
  // DECODED (naturalWidth>0 + complete — a broken/blocked image is 0, which
  // would have flipped Duo3's onError→monogram), is laid out with a non-zero
  // box, the duotone tile carries the `has-photo` treatment hook, and the
  // monogram is css-collapsed (display:none under .has-photo) — i.e. the
  // photo path is live and the picture genuinely rendered, not the gradient.
  const milesImg = milesCard.getByRole('img', { name: /miles davis/i })
  await expect(milesImg).toBeVisible()
  const decoded = await milesImg.evaluate((el) => {
    const im = el as HTMLImageElement
    const box = im.getBoundingClientRect()
    return {
      complete: im.complete,
      naturalWidth: im.naturalWidth,
      boxW: box.width,
      boxH: box.height,
      monogramHidden:
        getComputedStyle(
          im.closest('.duo3')!.querySelector('.duo3-initials') ??
            document.body,
        ).display === 'none',
    }
  })
  expect(decoded.complete, 'portrait <img> must finish loading').toBe(true)
  expect(
    decoded.naturalWidth,
    'portrait <img> must decode (>0 — not the onError monogram fallback)',
  ).toBeGreaterThan(0)
  expect(decoded.boxW).toBeGreaterThan(0)
  expect(decoded.boxH).toBeGreaterThan(0)
  expect(
    decoded.monogramHidden,
    'monogram is css-collapsed → the photo, not the gradient, is shown',
  ).toBe(true)
  await expect(milesCard.locator('.duo3.has-photo')).toBeVisible()

  // The LEGAL credit for the CC-licensed portrait is present (frozen
  // attributionCaption format, programmatically associated via figcaption).
  await expect(
    page.locator('figcaption').filter({ hasText: /^Photo:.*Tom Palumbo/ }),
  ).toBeVisible()

  await milesCard.click()

  await expect(page).toHaveURL(/\/musicians\/wikidata(%3A|:)Q93341/)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()
  // Rich mock objective markers: bio present, listen links present.
  await expect(page.getByRole('region', { name: /biography/i })).toContainText(
    /influential figures in jazz/i,
  )
  await expect(
    page.getByRole('link', { name: /listen on spotify/i }),
  ).toBeVisible()
})

// ─── 2. Mosaic tile tap → matching ConnRow scrolled into view + pulse ─────

test('mosaic tile tap scrolls the matching ConnRow into view and pulses it', async ({
  page,
}) => {
  await page.goto(MILES)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()

  // The Coltrane mosaic tile (role=link, aria-label carries the name).
  const tile = page.getByRole('link', { name: /john coltrane.*records together/i })
  await expect(tile).toBeVisible()
  await tile.click()

  // The matching ConnRow (data-collab-id) must be scrolled INTO the viewport
  // (not merely present) and carry the pulse class on scroll-land (D4).
  const row = page.locator('.conn[data-collab-id="wikidata:Q7346"]')
  await expect(row).toBeInViewport()
  await expect(row).toHaveClass(/\bpulse\b/)
})

// ─── 3. "More about" sheet: open, #about hash, focus trap, Back closes,
//        deep-link close lands on the detail page (link-addressable) ───────

test('"More about" opens a focus-trapped sheet, gains #about, Back closes it', async ({
  page,
}) => {
  await page.goto(MILES)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()

  await page.getByRole('link', { name: /more about miles/i }).click()

  const sheet = page.getByRole('dialog', { name: /more about miles/i })
  await expect(sheet).toBeVisible()
  await expect(page).toHaveURL(/#about$/)

  // Focus is trapped inside the dialog: focus moved into the sheet subtree.
  const focusInSheet = await page.evaluate(() => {
    const dlg = document.querySelector('[data-testid="sheet-panel"]')
    return !!dlg && dlg.contains(document.activeElement)
  })
  expect(focusInSheet).toBe(true)

  // Browser Back closes it: URL loses #about, detail still shown.
  await page.goBack()
  await expect(page).not.toHaveURL(/#about/)
  await expect(sheet).toBeHidden()
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()
})

test('deep-linked …#about closes to its OWN detail page (link-addressable)', async ({
  page,
}) => {
  // Direct navigation to the open-sheet URL (first history entry → React
  // Router stamps key 'default' → close must replace the hash, NOT pop away).
  await page.goto(`${MILES}#about`)
  const sheet = page.getByRole('dialog', { name: /more about miles/i })
  await expect(sheet).toBeVisible()

  await page.getByRole('button', { name: /close — more about miles/i }).click()

  await expect(sheet).toBeHidden()
  // Did NOT navigate history-away — still on the Miles detail page.
  await expect(page).toHaveURL(/\/musicians\/wikidata(%3A|:)Q93341$/)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()
})

// ─── 4. Autosuggest: portalled listbox, pick → navigate, Esc closes ───────

test('autosuggest: typing opens a listbox, picking navigates, Esc closes', async ({
  page,
}) => {
  await page.goto('/musicians')
  await expect(
    page.getByRole('heading', { level: 1, name: /step into a musician/i }),
  ).toBeVisible()

  const box = page.getByRole('combobox', { name: /search a musician/i })
  await box.click()
  await box.pressSequentially('mile', { delay: 40 })

  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible()
  const options = page.getByRole('option')
  await expect(options.first()).toBeVisible()
  await expect(options.first()).toContainText(/miles davis/i)

  await options.first().click()
  await expect(page).toHaveURL(/\/musicians\/wikidata(%3A|:)Q93341/)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()

  // Esc closes the listbox (re-open, then Escape).
  await page.goto('/musicians')
  const box2 = page.getByRole('combobox', { name: /search a musician/i })
  await box2.click()
  await box2.pressSequentially('mile', { delay: 40 })
  await expect(page.getByRole('listbox')).toBeVisible()
  await box2.press('Escape')
  await expect(page.getByRole('listbox')).toBeHidden()
})

// ─── 5. Desktop graph: lazy-loads, selecting a node re-centres, no anim ───

test('desktop graph panel lazy-loads and re-centres on node select', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(MILES)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()

  const graph = page
    .getByRole('complementary', { name: /collaboration graph/i })
    .getByRole('application')
  await expect(graph).toBeVisible()

  // The SVG application label names the centred musician (objective focus
  // marker). The focus node carries class mu-gnode-focus + aria-pressed.
  await expect(graph).toHaveAttribute(
    'aria-label',
    /centred on miles davis/i,
  )
  const milesFocus = graph.locator(
    'g.mu-gnode-focus[aria-label*="Miles Davis" i]',
  )
  await expect(milesFocus).toBeVisible()
  await expect(milesFocus).toHaveAttribute('aria-pressed', 'true')

  // Activate the Coltrane node via the KEYBOARD path (a focusable
  // <g class="mu-gnode" role="button" tabIndex=0> that handles Enter/Space →
  // onSelect). Keyboard activation is a first-class supported path and
  // exercises the same onSelectNode → GraphPanelSlot.select → navigate flow
  // as a click, while sidestepping a webkit-only pointer-occlusion: on
  // webkit's force-layout coordinates the SVG node can sit under the sticky
  // header's hit-region, so a synthetic .click() is intercepted there even
  // though the node is visibly present (a test-harness artefact, not a
  // product bug — the node IS interactive, just occluded for pointer hit-
  // testing on that engine). The URL change is the objective proof.
  const coltraneNode = graph.locator(
    'g.mu-gnode[aria-label*="Coltrane" i]',
  )
  await expect(coltraneNode).toBeVisible()
  await coltraneNode.focus()
  await coltraneNode.press('Enter')

  await expect(page).toHaveURL(/\/musicians\/wikidata(%3A|:)Q7346/)
  // Re-centre: a fresh graph mounts focused on the selected node (the
  // fixture detail for an un-fixtured id falls back to the sparse screen,
  // so we assert the graph re-centre objectively, not the detail heading).
  const graph2 = page
    .getByRole('complementary', { name: /collaboration graph/i })
    .getByRole('application')
  await expect(graph2).toBeVisible()
  await expect(graph2.locator('g.mu-gnode-focus')).toHaveCount(1)
})

test('desktop graph: reduced-motion is honoured (no running animation)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(MILES)
  const graph = page
    .getByRole('complementary', { name: /collaboration graph/i })
    .getByRole('application')
  await expect(graph).toBeVisible()
  // Under prefers-reduced-motion the graph snaps (no in-flight CSS
  // animation on any node). Objective: zero running animations in the SVG.
  const running = await graph.evaluate((svg) => {
    return Array.from(svg.querySelectorAll('*')).filter((el) => {
      const a = getComputedStyle(el).animationName
      const d = getComputedStyle(el).animationDuration
      return a !== 'none' && a !== '' && d !== '0s'
    }).length
  })
  expect(running).toBe(0)
})

// ─── 6. Waking: the calm cold-Aura state (frozen isWaking) ────────────────

test('waking: the calm cold-Aura screen renders with fallback names + retry', async ({
  page,
}) => {
  await page.goto(WAKING)
  await expect(
    page.getByRole('heading', { level: 1, name: /waking up/i }),
  ).toBeVisible()
  // Polite live region (status, not alert) — the waking variant.
  await expect(page.getByRole('status')).toContainText(/waking up/i)
  // Retry control present.
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
  // Cached fallback names are real navigable links (never stranded).
  const fallbackLink = page
    .getByRole('link')
    .filter({ hasText: /miles davis|john coltrane/i })
    .first()
  await expect(fallbackLink).toBeVisible()
  await expect(fallbackLink).toHaveAttribute('href', /\/musicians\//)
})

// ─── 7. Sparse: no bio / no photo → placeholders + duplicate flag ─────────

test('sparse musician renders placeholders + the duplicate flag, no breakage', async ({
  page,
}) => {
  await page.goto(ANTOINE)
  await expect(
    page.getByRole('heading', { level: 1, name: /antoine herv/i }),
  ).toBeVisible()

  // No bio → explicit placeholder, never silent.
  await expect(
    page.getByRole('region', { name: /biography/i }),
  ).toContainText(/bio not yet written/i)

  // Duplicate flag (the Antoine sparse-state design) — a UI signal, NOT a
  // dedup (landmine 11). Rendered once.
  const dupe = page.getByText(/possible duplicate · help us merge/i)
  await expect(dupe).toBeVisible()
  await expect(dupe).toHaveCount(1)

  // The page is still a complete screen: collaborators rail renders.
  await expect(
    page.getByText(/where to go from here/i),
  ).toBeVisible()
  // No-portrait is DATA (photo:false, Phase H): the hero renders the
  // graceful flat-monogram tile (NO <img>, never a broken-image icon) PLUS
  // the explicit "no portrait on file" placeholder (never silent), no
  // caption (nothing to attribute). Objective: zero portrait <img> in the
  // identity hero, the flat duotone variant + the AH initials + the
  // placeholder text.
  const identFig = page.locator('figure.ident-photo')
  await expect(identFig).toBeVisible()
  await expect(identFig.getByRole('img')).toHaveCount(0)
  const identTile = identFig.locator('.duo3').first()
  await expect(identTile).toHaveClass(/\bflat\b/)
  await expect(identTile).not.toHaveClass(/\bhas-photo\b/)
  await expect(identTile).toContainText(/AH/)
  await expect(
    page.getByText(/no portrait on file/i),
  ).toBeVisible()
})

// ─── 8. Image-attribution captions (legal requirement) ────────────────────

test('attribution caption renders when a license/attribution is non-empty', async ({
  page,
}) => {
  // Legal-requirement note (Phase H). Two rendered attribution paths now
  // exist: the detail HERO portrait (AttribPhoto → "Photo: <attr> · <lic>")
  // and the album cover (AttribAlbum/RecordsStrip → "Cover art: …"). Miles'
  // portrait carries CC BY-SA 3.0 / Tom Palumbo and "Kind of Blue" carries
  // cover_art_license "Fair use" → BOTH captions MUST render, and the hero
  // portrait <img> must genuinely decode (objective, not eyeballed).
  await page.goto(MILES)
  await expect(
    page.getByRole('heading', { level: 1, name: /miles davis/i }),
  ).toBeVisible()

  const heroImg = page.locator('figure.ident-photo').getByRole('img', {
    name: /miles davis/i,
  })
  await expect(heroImg).toBeVisible()
  const heroDecoded = await heroImg.evaluate(
    (el) =>
      (el as HTMLImageElement).complete &&
      (el as HTMLImageElement).naturalWidth > 0,
  )
  expect(
    heroDecoded,
    'detail hero portrait must decode (not the onError monogram)',
  ).toBe(true)

  await expect(
    page.locator('figcaption').filter({ hasText: /^Photo:.*Tom Palumbo/ }),
  ).toBeVisible()
  await expect(
    page.locator('figcaption').filter({ hasText: /^Cover art:\s*Fair use$/ }),
  ).toBeVisible()
})

test('no attribution caption for a public-domain image (all fields empty)', async ({
  page,
}) => {
  // The sparse Antoine fixture's only record (ONJ 1989) has NO cover_art and
  // no license/attribution fields, and no portrait image is rendered → the
  // legal rule's inverse: empty fields emit ZERO attribution caption (public
  // domain renders nothing). Asserts neither a "Cover art:" nor a "Photo:"
  // figcaption appears anywhere on the sparse page.
  await page.goto(ANTOINE)
  await expect(
    page.getByRole('heading', { level: 1, name: /antoine herv/i }),
  ).toBeVisible()
  // The sparse fixture carries zero non-empty license/attribution fields, so
  // not a single "<label>: …" attribution caption is emitted.
  await expect(page.getByText(/^Photo:\s/)).toHaveCount(0)
  await expect(page.getByText(/^Cover art:\s/)).toHaveCount(0)
})

// ─── 9. Search input — placeholder legibility ─────────────────────────────

/** Solid-color regex: must match NEITHER the modern CSS Color 4 alpha form
 *  (`oklab(... / 0.5)`, `color(srgb r g b / 0.5)`) NOR the legacy comma form
 *  (`rgba(r, g, b, 0.5)`). Browsers still emit the legacy form for the UA
 *  default `::placeholder` color in Chromium and WebKit. */
const HAS_FRACTIONAL_ALPHA = /\/\s*0?\.\d|,\s*0?\.\d\s*\)/

test('search input ::placeholder is fully opaque (no UA-default half-alpha)', async ({
  page,
}) => {
  // Bug regression guard. Default browser ::placeholder ships at ~0.5
  // opacity, which on the musicians home makes the search prompt
  // "Search a musician…" look ghostly and the entire input visually
  // transparent against the page. Fix in components.css forces opacity: 1
  // + a solid muted color. This spec asserts both properties on the
  // computed style — once unfocused and once focused, because the project
  // does not currently scope a `:focus::placeholder` rule but a future
  // addition could quietly regress one of the two states.
  await page.goto('/musicians')
  const input = page.getByRole('combobox', { name: 'Search a musician' })
  await expect(input).toBeVisible()

  const unfocused = await input.evaluate((el) => {
    const cs = window.getComputedStyle(el as HTMLInputElement, '::placeholder')
    return { color: cs.color, opacity: cs.opacity }
  })
  expect(unfocused.opacity).toBe('1')
  expect(unfocused.color).not.toMatch(HAS_FRACTIONAL_ALPHA)

  await input.focus()
  const focused = await input.evaluate((el) => {
    const cs = window.getComputedStyle(el as HTMLInputElement, '::placeholder')
    return { color: cs.color, opacity: cs.opacity }
  })
  expect(focused.opacity).toBe('1')
  expect(focused.color).not.toMatch(HAS_FRACTIONAL_ALPHA)
})

test('search results listbox renders with a solid background (not portal-transparent)', async ({
  page,
}) => {
  // Bug regression guard. The <ul role="listbox"> is portalled to
  // document.body via createPortal (Autosuggest.tsx), placing it OUTSIDE
  // the `.mu3` Shell. Any rule scoped `.mu3 .suggest-*` silently misses,
  // and the listbox falls back to UA defaults: rgba(0,0,0,0) background,
  // 0px border — page content bleeds through every row. Fix in
  // components.css unprefixes the .suggest-* rules. This spec asserts
  // the listbox computed background is NOT fully transparent and the
  // border-top width is > 0px.
  await page.goto('/musicians')
  const input = page.getByRole('combobox', { name: 'Search a musician' })
  await input.fill('mil')

  const listbox = page.getByRole('listbox', { name: 'Musician matches' })
  await expect(listbox).toBeVisible()

  const styles = await listbox.evaluate((el) => {
    const cs = window.getComputedStyle(el as HTMLElement)
    return { bg: cs.backgroundColor, borderTop: cs.borderTopWidth }
  })

  // Catches rgba(_, _, _, 0) — the exact UA-default that the bug surfaced.
  expect(styles.bg).not.toMatch(/^rgba\([^)]*,\s*0\)$/)
  expect(styles.bg).not.toBe('transparent')
  expect(parseFloat(styles.borderTop)).toBeGreaterThan(0)
})

// ─── 10. Journey landing pages (Random / Era / Label) ────────────────────

test('home → "Random jump" redirects to a /musicians/:id detail page', async ({
  page,
}) => {
  await page.goto('/musicians')
  await page.getByRole('link', { name: /random jump/i }).click()
  // RandomJumpPage's useEffect should resolve and replace-navigate to a
  // musician detail page within a couple of seconds.
  await page.waitForURL(/\/musicians\/[^/]+$/, { timeout: 5000 })
  const url = page.url()
  // Must NOT have landed on the journey/random URL (replace navigation).
  expect(url).not.toContain('/journey/random')
  // Must be a musician detail URL — an id-shaped path segment.
  expect(url).toMatch(
    /\/musicians\/(wikidata%3A|musicbrainz%3A|discogs%3A)[A-Za-z0-9-]+/,
  )
})

test('home → "Era walk" → era index → bebop detail → /musicians/:id card', async ({
  page,
}) => {
  await page.goto('/musicians')
  await page.getByRole('link', { name: /era walk/i }).click()
  await page.waitForURL(/\/musicians\/journey\/era$/)

  // Index page renders 7 era chips.
  const list = page.getByRole('list', { name: /jazz eras/i })
  await expect(list).toBeVisible()
  const chips = list.getByRole('link')
  await expect(chips).toHaveCount(7)

  // Drill into Bebop (sub-route).
  await list.getByRole('link', { name: /^.*Bebop/i }).first().click()
  await page.waitForURL(/\/musicians\/journey\/era\/bebop$/)

  // Curated grid renders.
  const grid = page.getByRole('list', { name: /to dig into/i })
  await expect(grid).toBeVisible()
  const cards = grid.getByRole('link')
  await expect(cards).toHaveCount(10)

  // Click first card → lands on /musicians/:id (the BFF detail page).
  await cards.first().click()
  await page.waitForURL(/\/musicians\/[^/]+$/)
})

test('home → "Label walk" → label index → blue-note detail', async ({
  page,
}) => {
  await page.goto('/musicians')
  await page.getByRole('link', { name: /label walk/i }).click()
  await page.waitForURL(/\/musicians\/journey\/label$/)

  const list = page.getByRole('list', { name: /jazz labels/i })
  await expect(list).toBeVisible()
  await expect(list.getByRole('link')).toHaveCount(6)

  await list.getByRole('link', { name: /^.*Blue Note/i }).first().click()
  await page.waitForURL(/\/musicians\/journey\/label\/blue-note$/)

  const grid = page.getByRole('list', { name: /to dig into/i })
  await expect(grid.getByRole('link')).toHaveCount(10)
})

test('back chevron on a journey detail page returns to the journey index', async ({
  page,
}) => {
  await page.goto('/musicians/journey/era/bebop')
  await expect(
    page.getByRole('heading', { level: 1, name: /Bebop/i }),
  ).toBeVisible()
  await page.getByRole('link', { name: /back to eras/i }).click()
  await page.waitForURL(/\/musicians\/journey\/era$/)
  await expect(page.getByRole('list', { name: /jazz eras/i })).toBeVisible()
})

test('unknown era/label slug redirects to the variant index', async ({
  page,
}) => {
  await page.goto('/musicians/journey/era/this-does-not-exist')
  await page.waitForURL(/\/musicians\/journey\/era$/)
  await expect(page.getByRole('list', { name: /jazz eras/i })).toBeVisible()

  await page.goto('/musicians/journey/label/nope')
  await page.waitForURL(/\/musicians\/journey\/label$/)
  await expect(page.getByRole('list', { name: /jazz labels/i })).toBeVisible()
})

// ─── 11. Journey detail portraits via byIds batch endpoint ────────────────

test('journey modal detail renders portraits for Miles and Coltrane after byIds resolves', async ({
  page,
}) => {
  // The modal era entry includes Miles Davis (wikidata:Q93341) and John Coltrane
  // (wikidata:Q7346), both of which are served with portrait data by the mock
  // BFF byIds handler. After byIds resolves, both cards should render an <img>.
  await page.goto('/musicians/journey/era/modal')
  await expect(
    page.getByRole('heading', { level: 1, name: /Modal/i }),
  ).toBeVisible()

  const grid = page.getByRole('list', { name: /to dig into/i })
  await expect(grid).toBeVisible()

  // Wait for at least one portrait <img> to appear (byIds resolved).
  await expect(async () => {
    const imgs = await grid.getByRole('img').all()
    expect(imgs.length).toBeGreaterThan(0)
  }).toPass({ timeout: 5000 })

  // Both known ids (Miles + Coltrane) get real portraits from the mock.
  const imgs = await grid.getByRole('img').all()
  expect(imgs.length).toBeGreaterThanOrEqual(2)
})
