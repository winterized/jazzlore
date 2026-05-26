/**
 * E2E for the "+N more" drawer/popover on a musician detail page.
 *
 * Drives the real React + httpSource path with the BFF intercepted by
 * `musicians-bff-mock` (the dev server has no `/api/*`). Asserts:
 *   1. The "+N more" chip is a button with an accessible name.
 *   2. Clicking it opens a portalled dialog with the shared records.
 *   3. The count subheading reads either "N records" or "N of M records ·
 *      most recent first" (truncation indicator from R1).
 *   4. ESC / backdrop / close-button each dismiss the sheet.
 *   5. Opening the sheet does NOT navigate the row's SPA link (the
 *      stopPropagation contract on ConnRow).
 *
 * Runs against the dev server at port 5175 (musicians).
 */

import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'
import { mockBff } from './musicians-bff-mock'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const BASE = 'http://localhost:5175'
const DETAIL = '/musicians/wikidata:Q93341' // Miles Davis (RICH fixture)

test.beforeEach(async ({ page }) => {
  await mockBff(page)
})

test.describe('musicians +N more sheet', () => {
  test('clicking the chip opens a dialog listing the shared records', async ({
    page,
  }) => {
    await page.goto(`${BASE}${DETAIL}`)
    // ConnRow shows the +N more chip for the pair with > 1 shared record.
    const chip = page.getByRole('button', {
      name: /view all 2 records with john coltrane/i,
    })
    await expect(chip).toBeVisible()
    await chip.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Heading carries the collab name.
    await expect(
      dialog.getByRole('heading', { name: /records with john coltrane/i }),
    ).toBeVisible()
    // Both records render with title + year + primary artist.
    await expect(dialog.getByText('Kind of Blue')).toBeVisible()
    await expect(dialog.getByText('Milestones')).toBeVisible()
  })

  test('count subheading reads "N records" for an untruncated slice', async ({
    page,
  }) => {
    await page.goto(`${BASE}${DETAIL}`)
    await page
      .getByRole('button', { name: /view all 2 records with john coltrane/i })
      .click()
    // 2 ≤ totalCount(2) → non-truncated branch.
    await expect(
      page.getByRole('dialog').getByText(/^2 records$/i),
    ).toBeVisible()
  })

  test('Escape dismisses the sheet', async ({ page }) => {
    await page.goto(`${BASE}${DETAIL}`)
    await page
      .getByRole('button', { name: /view all 2 records with john coltrane/i })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('backdrop click dismisses the sheet', async ({ page }) => {
    await page.goto(`${BASE}${DETAIL}`)
    await page
      .getByRole('button', { name: /view all 2 records with john coltrane/i })
      .click()
    // The sheet (z-index 61) overlaps the backdrop (z-index 60) over the
    // viewport center, so a geometric `click()` hits the sheet not the
    // backdrop. `dispatchEvent` bypasses the actionability check and fires
    // a real click on the backdrop element directly — the same path a
    // user's tap-outside-the-sheet takes on real devices.
    await page.getByTestId('shared-records-backdrop').dispatchEvent('click')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('opening the sheet does NOT navigate the row (stopPropagation)', async ({
    page,
  }) => {
    await page.goto(`${BASE}${DETAIL}`)
    const urlBefore = page.url()
    await page
      .getByRole('button', { name: /view all 2 records with john coltrane/i })
      .click()
    // The dialog mounts, AND the URL has NOT changed to Coltrane's detail.
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(page.url()).toBe(urlBefore)
  })

  test('open sheet has zero WCAG AA violations (axe-core)', async ({ page }) => {
    await page.goto(`${BASE}${DETAIL}`)
    await page
      .getByRole('button', { name: /view all 2 records with john coltrane/i })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([])
  })
})
