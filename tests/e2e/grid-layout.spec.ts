/**
 * 2-column card grid — behavioural guards.
 *
 * (a) Computed `grid-template-columns` has 1 track below xl (1279) and 2
 *     tracks at xl (1280), for BOTH apps. Asserts the computed style, not the
 *     className, so a class refactor can't silently break the contract.
 * (b) Scroll-spy correctness at 2-col (chords @1280): clicking the chip for a
 *     RIGHT-column chord activates/scrolls THAT chord, not its left-column
 *     row-mate. Guards a subtle scroll-spy/grid regression class.
 * (c) A half-width chord card at 1280 renders the SAME internal layout as a
 *     full-width chord card at a 640px viewport (the explicit requirement).
 * (d) The grid-scoped compact override does NOT leak to the always-full-width
 *     /collection/chords page — it must keep the wide >=768 layout at >=1280.
 */

import { test, expect, type Page } from '@playwright/test'

const CHORDS = 'http://localhost:5174/chords/C'
const SCALES = 'http://localhost:5173/scales/C'

async function settle(page: Page, url: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /C (chords|scales)/i }).waitFor()
  await page.evaluate(() => document.fonts.ready)
}

/** Number of column tracks in the element's resolved grid-template-columns. */
function trackCount(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length)
}

/** Normalised computed `grid-template-areas` of the first match (per-row
 *  quoted strings; whitespace collapsed so chromium/webkit compare equal). */
function gridAreas(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).gridTemplateAreas.replace(/\s+/g, ' ').trim())
}

// The two .chord-row internal layouts the override toggles between.
const COMPACT_AREAS = '"info score actions" "kbd kbd kbd"' // 480–767 and (inGrid) >=1280
const WIDE_AREAS = '"info info actions" "score kbd kbd"' //  >=768 full-width

// chords: each group's <ul>; scales: each expanded family's panel <div>.
const CHORDS_GRID = 'section[aria-label="TRIADS"] ul'
const SCALES_GRID = 'div[id^="family-"]'

test('chords card grid: 1 column below xl, 2 columns at xl', async ({ page }) => {
  await page.setViewportSize({ width: 1279, height: 832 })
  await settle(page, CHORDS)
  expect(await trackCount(page, CHORDS_GRID)).toBe(1)

  await page.setViewportSize({ width: 1280, height: 900 })
  await settle(page, CHORDS)
  expect(await trackCount(page, CHORDS_GRID)).toBe(2)
})

test('scales card grid: 1 column below xl, 2 columns at xl', async ({ page }) => {
  await page.setViewportSize({ width: 1279, height: 832 })
  await settle(page, SCALES)
  // First family is expanded by default → its panel exists.
  await page.locator(SCALES_GRID).first().waitFor()
  expect(await trackCount(page, SCALES_GRID)).toBe(1)

  await page.setViewportSize({ width: 1280, height: 900 })
  await settle(page, SCALES)
  await page.locator(SCALES_GRID).first().waitFor()
  expect(await trackCount(page, SCALES_GRID)).toBe(2)
})

test('chords @1280: right-column chip targets that chord, not its row-mate', async ({
  page,
}) => {
  // TRIADS = [maj, min, dim, aug, sus2, sus4]. At 2-col row-major:
  // row1 = [maj (left col), min (right col)]. Clicking the RIGHT-column
  // chord's chip (chord-min) must activate/scroll chord-min, not chord-maj.
  await page.setViewportSize({ width: 1280, height: 900 })
  await settle(page, CHORDS)

  // Confirm 2-col actually in effect (precondition for the guard).
  expect(await trackCount(page, CHORDS_GRID)).toBe(2)

  await page.locator('[data-chip-id="chord-min"]').click()

  await expect(page.locator('#chord-min')).toBeInViewport()
  await expect(page.locator('[data-chip-id="chord-min"]')).toHaveAttribute(
    'aria-current',
    'true',
  )
  // The left-column row-mate's chip must NOT be the active one.
  await expect(page.locator('[data-chip-id="chord-maj"]')).not.toHaveAttribute(
    'aria-current',
    'true',
  )
})

test('chords @1280: half-width card uses the SAME compact layout as a full 640-viewport card', async ({
  page,
}) => {
  const CARD = 'section[aria-label="TRIADS"] .chord-row'

  // Full-width chord card at a 640px viewport → the 480–767 compact layout
  // (mini-score on the header row, full-width keyboard below).
  await page.setViewportSize({ width: 640, height: 900 })
  await settle(page, CHORDS)
  const at640 = await gridAreas(page, CARD)

  // Half-width chord card inside the 2-col grid at 1280 → must be the exact
  // same internal layout (the user's explicit requirement), driven by the
  // grid-scoped @media(min-width:1280px) .chord-card-grid override.
  await page.setViewportSize({ width: 1280, height: 900 })
  await settle(page, CHORDS)
  expect(await trackCount(page, CHORDS_GRID)).toBe(2) // precondition: 2-col in effect
  const at1280 = await gridAreas(page, CARD)

  expect(at640).toBe(COMPACT_AREAS)
  expect(at1280).toBe(COMPACT_AREAS)
  expect(at1280).toBe(at640)
  expect(at1280).not.toBe(WIDE_AREAS)
})

test('collection page chord card stays WIDE at >=1280 (grid-scoped override does not leak)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  // Save a chord, then open the collection — an always-full-width flex list
  // with NO .chord-card-grid ancestor (and ChordRow gets no inGrid prop).
  await page.goto('http://localhost:5174/chords/C', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Save Cmaj7 to my collection/i }).click()
  await page.getByRole('link', { name: /My chord collection/i }).click()
  await expect(page).toHaveURL(/\/collection\/chords/)

  const card = page.locator('[data-testid="chord-row"]').first()
  await card.waitFor()
  const areas = await card.evaluate((el) =>
    getComputedStyle(el).gridTemplateAreas.replace(/\s+/g, ' ').trim(),
  )
  // Must keep the wide >=768 layout at 1280, NOT the compact map the
  // ChordsPage 2-col grid uses — proves the override is correctly scoped.
  expect(areas).toBe(WIDE_AREAS)
  expect(areas).not.toBe(COMPACT_AREAS)
})
