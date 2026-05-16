/**
 * Capture harness for the 2-column-grid change's MD5 regression gate.
 *
 * Reuses the determinism scaffold from `sticky-post-capture.spec.ts`:
 *  - `prefers-reduced-motion: reduce`
 *  - theme seeded via localStorage (`jazzlore:theme:v1`) before first paint
 *  - fixed viewports; wait for in-header <h1> + networkidle + first content
 *    row + `document.fonts.ready` (no fixed sleeps)
 *
 * Output dir is env-controlled (`GRID_CAP_DIR`) so PRE/POST/determinism runs
 * land in separate gitignored folders under `baselines/` and can be md5-diffed.
 *
 * Sub-breakpoint viewports (390/1024/1280/1535) are the MD5-gated set — they
 * must be byte-identical PRE vs POST (layout unchanged below 2xl/1536). The
 * 1536/1920 set is the at/above-breakpoint visual confirmation (NOT md5-gated;
 * 2-col is expected there).
 */

import { test, expect, type Page } from '@playwright/test'

const OUT_DIR = process.env.GRID_CAP_DIR ?? 'baselines/grid-tmp'

type Theme = 'light' | 'dark'

type Viewport = { w: number; h: number; gated: boolean }
const VIEWPORTS: readonly Viewport[] = [
  { w: 390, h: 844, gated: true }, // mobile
  { w: 1024, h: 832, gated: true }, // small desktop
  { w: 1280, h: 832, gated: true }, // existing desktop preset — the C3 anchor
  { w: 1535, h: 832, gated: true }, // one px below 2xl — exact flip boundary
  { w: 1536, h: 900, gated: false }, // at breakpoint — 2-col expected
  { w: 1920, h: 1080, gated: false }, // wide — 2-col expected
]

const BASE_URL = {
  scales: 'http://localhost:5173',
  chords: 'http://localhost:5174',
} as const
const PATH = { scales: '/scales/C', chords: '/chords/C' } as const

async function seedTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((t) => {
    window.localStorage.setItem('jazzlore:theme:v1', JSON.stringify(t))
  }, theme)
}

async function gotoSettled(page: Page, url: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /C (chords|scales)/i }).waitFor()
  await page.locator('main >> :is(li, [class*="scroll-mt"], button)').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}

for (const app of ['chords', 'scales'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const vp of VIEWPORTS) {
      const name = `${app}-${theme}-${vp.w}x${vp.h}`
      test(`capture ${name}`, async ({ page }, testInfo) => {
        // Namespace by engine — chromium & webkit must never share a path
        // (MD5 is per-engine: chromium↔chromium, webkit↔webkit).
        const eng = testInfo.project.name
        await page.setViewportSize({ width: vp.w, height: vp.h })
        await seedTheme(page, theme)
        await gotoSettled(page, `${BASE_URL[app]}${PATH[app]}`)
        const full = await page.screenshot({ path: `${OUT_DIR}/${eng}/${name}.png`, fullPage: true })
        expect(full.length, `${name} fullPage must be non-empty`).toBeGreaterThan(0)
        const vpShot = await page.screenshot({ path: `${OUT_DIR}/${eng}/viewport/${name}.png` })
        expect(vpShot.length, `${name} viewport must be non-empty`).toBeGreaterThan(0)
      })
    }
  }
}
