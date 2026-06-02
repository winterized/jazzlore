// Musicians — share/install header slot (Phase B web change, Gate B3).
//
// One header slot, mutually exclusive:
//   - browser/PWA  → PwaInstallButton (share hidden)
//   - native shell → ShareButton      (install hidden)
// Detail page carries both (share is per-musician); home carries install only.
//
// Runs against the PWA preview build on :5185 with the detail BFF call routed
// to the Miles fixture so the real header renders. Native mode is emulated by
// injecting `window.Capacitor.isNativePlatform = () => true` before the SPA
// mounts (the same global isNativeApp() reads). Chromium only — these are
// header-slot screenshots + structural assertions, not cross-engine pixels.

import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const PREVIEW_BASE = 'http://localhost:5185'
const ID = 'wikidata:Q93341'
const ENC_ID = encodeURIComponent(ID)

const __dirname = dirname(fileURLToPath(import.meta.url))
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

const INSTALL = /install Musicians/i
const SHARE = /share Miles Davis/i

test.describe('musicians share/install header slot (Gate B3)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'header-slot screenshots — chromium only',
  )
  test.use({ viewport: { width: 390, height: 844 } })

  test('browser: install shows, share hidden (detail + home)', async ({ page }) => {
    await routeApi(page)

    await page.goto(`${PREVIEW_BASE}/musicians/${ENC_ID}`)
    await expect(page.getByText('Miles Davis').first()).toBeVisible()
    await expect(page.getByRole('button', { name: INSTALL })).toBeVisible()
    await expect(page.getByRole('button', { name: SHARE })).toHaveCount(0)
    await page
      .locator('header.hdr')
      .screenshot({ path: 'test-results/musicians-slot-browser-detail.png' })

    await page.goto(`${PREVIEW_BASE}/musicians`)
    await expect(page.getByRole('button', { name: INSTALL })).toBeVisible()
    await page
      .locator('header.hdr')
      .screenshot({ path: 'test-results/musicians-slot-browser-home.png' })
  })

  test('native: share shows, install hidden (detail); home has no install', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { Capacitor: unknown }).Capacitor = {
        isNativePlatform: () => true,
      }
    })
    await routeApi(page)

    await page.goto(`${PREVIEW_BASE}/musicians/${ENC_ID}`)
    await expect(page.getByText('Miles Davis').first()).toBeVisible()
    await expect(page.getByRole('button', { name: SHARE })).toBeVisible()
    await expect(page.getByRole('button', { name: INSTALL })).toHaveCount(0)
    await page
      .locator('header.hdr')
      .screenshot({ path: 'test-results/musicians-slot-native-detail.png' })

    // Home shows neither install (native) nor share (detail-only).
    await page.goto(`${PREVIEW_BASE}/musicians`)
    await expect(page.getByRole('button', { name: INSTALL })).toHaveCount(0)
    await expect(page.getByRole('button', { name: SHARE })).toHaveCount(0)
    await page
      .locator('header.hdr')
      .screenshot({ path: 'test-results/musicians-slot-native-home.png' })
  })
})
