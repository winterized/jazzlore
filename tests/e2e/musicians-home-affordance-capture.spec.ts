// Musicians — home-affordance visual gate (Item 3, family-alignment).
//
// Captures the detail-page header with the new Jazzlore home affordance at
// mobile (390 → home ICON) and desktop (1280 → "Jazzlore" brand TEXT) widths,
// light + dark, so Aurélien can eyeball header crowding before merge. Routes
// the detail BFF call to the Miles fixture so the real header renders without
// live Aura. Chromium-only screenshot deliverable (not a cross-engine pixel
// baseline). Output: test-results/home-affordance/*.png.

import { test, expect, type Page } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const PREVIEW_BASE = 'http://localhost:5185'
const ID = 'wikidata:Q93341'
const ENC_ID = encodeURIComponent(ID)

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../../test-results/home-affordance')
const MILES = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures/musician-detail-miles.json'), 'utf8'),
)
const EMPTY = { items: [], corpus: [], curated: [], graph: { nodes: [], edges: [] } }

async function routeApi(page: Page): Promise<void> {
  await page.route('**/api/musicians/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const isDetail = path === `/api/musicians/${ENC_ID}`
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(isDetail ? MILES : EMPTY),
    })
  })
}

function themeOf(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}
async function setTheme(page: Page, want: 'light' | 'dark'): Promise<void> {
  if ((await themeOf(page)) !== want) {
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect.poll(() => themeOf(page)).toBe(want)
  }
}

const VIEWPORTS = [
  { tag: 'mobile-390', w: 390, h: 844 },
  { tag: 'desktop-1280', w: 1280, h: 900 },
] as const
const THEMES = ['light', 'dark'] as const

test.describe('musicians home-affordance visual gate (Item 3)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'screenshot deliverable — chromium only',
  )

  test('capture detail header at both widths, both themes', async ({ page }) => {
    mkdirSync(OUT, { recursive: true })
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h })
      for (const th of THEMES) {
        await routeApi(page)
        await page.goto(`${PREVIEW_BASE}/musicians/${ENC_ID}`)
        await expect(page.getByText('Miles Davis').first()).toBeVisible()
        await setTheme(page, th)
        // Sanity: the right variant is the visible one at this width.
        const brand = page.locator('a.home-brand')
        const icon = page.locator('a.home-ic')
        if (vp.w >= 640) {
          await expect(brand).toBeVisible()
          await expect(icon).toBeHidden()
        } else {
          await expect(icon).toBeVisible()
          await expect(brand).toBeHidden()
        }
        // Header crop (the crowding question) + a top-of-page context shot.
        await page
          .locator('header.hdr')
          .screenshot({ path: join(OUT, `header-${vp.tag}-${th}.png`) })
        await page.screenshot({
          path: join(OUT, `page-${vp.tag}-${th}.png`),
          clip: { x: 0, y: 0, width: vp.w, height: Math.min(vp.h, 360) },
        })
      }
    }
  })
})
