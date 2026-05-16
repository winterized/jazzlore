/**
 * 2-column card grid — behavioural guards.
 *
 * (a) Computed `grid-template-columns` has 1 track below 2xl (1280) and 2
 *     tracks at 2xl (1536), for BOTH apps. Asserts the computed style, not the
 *     className, so a class refactor can't silently break the contract.
 * (b) Scroll-spy correctness at 2-col (chords @1536): clicking the chip for a
 *     RIGHT-column chord activates/scrolls THAT chord, not its left-column
 *     row-mate. Guards a subtle scroll-spy/grid regression class.
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

// chords: each group's <ul>; scales: each expanded family's panel <div>.
const CHORDS_GRID = 'section[aria-label="TRIADS"] ul'
const SCALES_GRID = 'div[id^="family-"]'

test('chords card grid: 1 column below 2xl, 2 columns at 2xl', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 832 })
  await settle(page, CHORDS)
  expect(await trackCount(page, CHORDS_GRID)).toBe(1)

  await page.setViewportSize({ width: 1536, height: 900 })
  await settle(page, CHORDS)
  expect(await trackCount(page, CHORDS_GRID)).toBe(2)
})

test('scales card grid: 1 column below 2xl, 2 columns at 2xl', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 832 })
  await settle(page, SCALES)
  // First family is expanded by default → its panel exists.
  await page.locator(SCALES_GRID).first().waitFor()
  expect(await trackCount(page, SCALES_GRID)).toBe(1)

  await page.setViewportSize({ width: 1536, height: 900 })
  await settle(page, SCALES)
  await page.locator(SCALES_GRID).first().waitFor()
  expect(await trackCount(page, SCALES_GRID)).toBe(2)
})

test('chords @1536: right-column chip targets that chord, not its row-mate', async ({
  page,
}) => {
  // TRIADS = [maj, min, dim, aug, sus2, sus4]. At 2-col row-major:
  // row1 = [maj (left col), min (right col)]. Clicking the RIGHT-column
  // chord's chip (chord-min) must activate/scroll chord-min, not chord-maj.
  await page.setViewportSize({ width: 1536, height: 900 })
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
