/**
 * Phase 9 — post-redesign visual capture for the sticky-header feature.
 *
 * Writes the `baselines/sticky-post/` matrix that pairs 1:1 with the design
 * handoff screenshots (`design_handoff_sticky_header/screenshots/`). This is a
 * design-match reference, NOT an MD5 gate — the header is an intentional
 * redesign and the palette is token-mapped (stone/amber), so pixel-equality
 * with the handoff is explicitly not expected.
 *
 * `baselines/` is gitignored (same pattern as the Phase-5 `sticky-pre/` set),
 * so these images are produced for review but never committed.
 *
 * Determinism:
 *  - `prefers-reduced-motion: reduce` → no title-shrink / chip-scroll easing.
 *  - Theme seeded via localStorage (`jazzlore:theme:v1`) BEFORE first paint so
 *    the very first render is in the target theme (no toggle-click flash).
 *  - Fixed viewports; wait for the in-header `<h1>` + `networkidle`, then the
 *    first card/group as an explicit settle locator — no fixed sleeps.
 *  - Two framings per state:
 *     • `<name>.png`           — `fullPage: true` (header + all body dividers,
 *                                the deliverable's explicit requirement).
 *     • `viewport/<name>.png`  — viewport-only, matching the handoff set's
 *                                ~viewport framing so the header design-match
 *                                comparison is 1:1 (the handoff captures are
 *                                viewport-framed, not full-page).
 *
 * Filenames mirror the handoff set exactly so each pair compares directly.
 */

import { test, type Page } from '@playwright/test'

const OUT_DIR = 'baselines/sticky-post'

const DESKTOP = { width: 1280, height: 832 }
const MOBILE = { width: 390, height: 844 }

type Theme = 'light' | 'dark'

/** Seed the theme override before any app script runs so first paint matches. */
async function seedTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((t) => {
    window.localStorage.setItem('jazzlore:theme:v1', JSON.stringify(t))
  }, theme)
}

/** Navigate + wait for a deterministic settle (heading, network, first card). */
async function gotoSettled(page: Page, url: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url, { waitUntil: 'networkidle' })
  // The in-header <h1> ("C chords" / "C scales") is the readiness signal.
  await page.getByRole('heading', { name: /C (chords|scales)/i }).waitFor()
  // First content row is the explicit body settle locator (no fixed sleep).
  await page.locator('main >> :is(li, [class*="scroll-mt"], button)').first().waitFor()
  // Fonts loaded → text metrics stable for the design-match comparison.
  await page.evaluate(() => document.fonts.ready)
}

type Shot = {
  file: string
  app: 'chords' | 'scales'
  theme: Theme
  device: 'desktop' | 'mobile'
}

// Filenames parallel the handoff screenshots/ set 1:1.
const SHOTS: readonly Shot[] = [
  { file: '01-chords-desktop-dark.png', app: 'chords', theme: 'dark', device: 'desktop' },
  { file: '02-chords-desktop-light.png', app: 'chords', theme: 'light', device: 'desktop' },
  { file: '03-scales-desktop-dark.png', app: 'scales', theme: 'dark', device: 'desktop' },
  { file: '04-scales-desktop-light.png', app: 'scales', theme: 'light', device: 'desktop' },
  { file: '05-chords-mobile-dark.png', app: 'chords', theme: 'dark', device: 'mobile' },
  { file: '06-chords-mobile-light.png', app: 'chords', theme: 'light', device: 'mobile' },
  { file: '07-scales-mobile-dark.png', app: 'scales', theme: 'dark', device: 'mobile' },
  { file: '08-scales-mobile-light.png', app: 'scales', theme: 'light', device: 'mobile' },
]

const BASE_URL: Record<Shot['app'], string> = {
  scales: 'http://localhost:5173',
  chords: 'http://localhost:5174',
}

const PATH: Record<Shot['app'], string> = {
  scales: '/scales/C',
  chords: '/chords/C',
}

for (const shot of SHOTS) {
  test(`capture ${shot.file}`, async ({ page }) => {
    await page.setViewportSize(shot.device === 'desktop' ? DESKTOP : MOBILE)
    await seedTheme(page, shot.theme)
    await gotoSettled(page, `${BASE_URL[shot.app]}${PATH[shot.app]}`)
    // Full-page (deliverable requirement) + viewport-framed companion (1:1
    // with the handoff's viewport framing for the header design-match).
    await page.screenshot({ path: `${OUT_DIR}/${shot.file}`, fullPage: true })
    await page.screenshot({ path: `${OUT_DIR}/viewport/${shot.file}` })
  })
}

// Mobile root-note bottom sheet open — pairs with handoff 09-mobile-root-sheet.
test('capture 09-mobile-root-sheet.png', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await seedTheme(page, 'dark')
  await gotoSettled(page, `${BASE_URL.chords}${PATH.chords}`)

  // The compact "C ▾" pill (aria-haspopup="dialog") opens the portalled sheet.
  const pill = page
    .getByRole('button', { name: /^C/ })
    .and(page.locator('[aria-haspopup="dialog"]'))
  await pill.click()
  await page.getByRole('dialog', { name: 'Root note' }).waitFor()

  // The sheet is `position: fixed` (portalled to document.body) — under
  // `fullPage` it would anchor to the top of the expanded page, not over the
  // visible viewport. The VIEWPORT-framed shot is the meaningful one here
  // (matches the handoff's 09 viewport framing); the fullPage is kept only
  // for matrix completeness.
  await page.screenshot({ path: `${OUT_DIR}/09-mobile-root-sheet.png`, fullPage: true })
  await page.screenshot({ path: `${OUT_DIR}/viewport/09-mobile-root-sheet.png` })
})
