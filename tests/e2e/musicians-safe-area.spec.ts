// Musicians — safe-area regression check (Phase A PWA conversion, Gate A1).
//
// The PWA adds `viewport-fit=cover`, so in the standalone PWA + native iOS
// shell the web content draws under the status bar / notch (top) and the home
// indicator (bottom). The fix adds env(safe-area-inset-*) padding to the
// universal header `.mu3 .hdr` (top) and to every page's `.mu3 main` (bottom).
//
// Faithful shim (same approach as tests/e2e/metronome-issue-105.spec.ts):
// Playwright/Chromium does NOT emit env(safe-area-inset-*) from device
// emulation, so this harness (a) overrides the exact selectors the fix added
// env() to with the real per-device values, and (b) draws visible status-bar +
// home-indicator overlays so a screenshot 1:1 models the OS-occluded regions.
// The structural assertions are the meaningful proof:
//   - the header's first control sits BELOW the status bar (y >= safeTop), and
//   - when scrolled to the end, the footer sits ABOVE the home indicator
//     (bottom <= viewport.height - safeBottom).
//
// Runs against the PWA preview build on :5185 with the detail BFF call routed
// to a real (trimmed) Miles fixture so an actual detail page — header + footer
// — renders. Chromium only: this is structural geometry, not a cross-engine
// pixel baseline.

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

const DEVICES = [
  { name: 'iphone-se', viewport: { width: 375, height: 667 }, safeTop: 20, safeBottom: 0 },
  { name: 'iphone-15', viewport: { width: 393, height: 852 }, safeTop: 47, safeBottom: 34 },
  { name: 'iphone-15-pro-max', viewport: { width: 430, height: 932 }, safeTop: 59, safeBottom: 34 },
] as const

// Patch matchMedia BEFORE the SPA mounts so display-mode: standalone matches on
// first render (verbatim approach from pwa-install / issue-105 harnesses).
async function setStandaloneEmulation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const mm = window.matchMedia.bind(window)
    window.matchMedia = (q: string) => {
      if (q.includes('display-mode: standalone')) {
        return {
          matches: true,
          media: q,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          onchange: null,
          dispatchEvent: () => false,
        } as unknown as MediaQueryList
      }
      return mm(q)
    }
  })
}

// (a) env() override on the exact selectors the fix added env() to, driven to
//     the real device values. (b) visible status-bar + home-indicator overlays.
async function applySafeAreaShim(page: Page, top: number, bottom: number): Promise<void> {
  await page.addStyleTag({
    content: `
      .mu3 .hdr            { padding-top: ${top}px !important; }
      .mu3 main            { padding-bottom: ${bottom}px !important; }
      .mu3 .offline-banner { padding-top: calc(7px + ${top}px) !important; }

      :root::before, :root::after {
        position: fixed; left: 0; right: 0;
        background: rgba(40, 40, 40, 0.78);
        color: rgba(255, 255, 255, 0.9);
        font: 600 9px/1 system-ui, sans-serif;
        letter-spacing: 0.1em; text-align: center;
        padding-top: 4px; z-index: 9999; pointer-events: none;
      }
      :root::before { top: 0;    height: ${top}px;    content: "STATUS BAR (${top}px)"; }
      :root::after  { bottom: 0; height: ${bottom}px; content: "HOME INDICATOR (${bottom}px)"; }
    `,
  })
}

test.describe('musicians safe-area (Gate A1 regression)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'structural geometry — chromium only',
  )

  for (const d of DEVICES) {
    test(`detail header + footer clear the safe area — ${d.name}`, async ({ page }) => {
      await setStandaloneEmulation(page)
      await page.setViewportSize(d.viewport)
      await page.route('**/api/musicians/**', async (route) => {
        const path = new URL(route.request().url()).pathname
        const isDetail = path === `/api/musicians/${ENC_ID}`
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(isDetail ? MILES : EMPTY),
        })
      })
      await page.goto(`${PREVIEW_BASE}/musicians/${ENC_ID}`)
      await expect(page.getByText('Miles Davis').first()).toBeVisible()
      await applySafeAreaShim(page, d.safeTop, d.safeBottom)

      // `.desk-hdr` is a dead/unused rule — confirm only `.hdr` renders, so the
      // header inset lands on the element that actually mounts (Gate A1 flag).
      expect(await page.locator('.desk-hdr').count()).toBe(0)
      expect(await page.locator('.hdr').count()).toBeGreaterThan(0)

      // Header: the first control (back button) sits BELOW the status bar.
      const back = await page.locator('.hdr .ic-back').boundingBox()
      expect(back, 'back button has a box').not.toBeNull()
      expect(
        back!.y,
        `back-button top (${back!.y}) must be ≥ safeTop (${d.safeTop})`,
      ).toBeGreaterThanOrEqual(d.safeTop)

      // Footer: scroll to the end, then the trademark footer must clear the
      // home indicator (its bottom ≤ viewport.height - safeBottom).
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(150)
      const footer = await page.locator('main footer').boundingBox()
      expect(footer, 'footer has a box').not.toBeNull()
      expect(
        footer!.y + footer!.height,
        `footer bottom (${footer!.y + footer!.height}) must be ≤ viewport - safeBottom (${d.viewport.height - d.safeBottom})`,
      ).toBeLessThanOrEqual(d.viewport.height - d.safeBottom + 1)

      await page.screenshot({
        path: `test-results/musicians-safe-area-${d.name}.png`,
      })
    })
  }
})
