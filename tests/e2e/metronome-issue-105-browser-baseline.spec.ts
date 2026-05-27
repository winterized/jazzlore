// Metronome — issue #105 Option 4 browser-mode visual baseline.
//
// Companion to `metronome-issue-105.spec.ts` (which runs in
// standalone-PWA emulation with a safe-area shim). This spec runs in
// REAL browser mode — no standalone emulation, no safe-area shim, no
// status-bar/home-indicator overlays — and pins the layout to a
// committed screenshot baseline.
//
// Why both:
//   • `metronome-issue-105.spec.ts` proves Start is visible under
//     iOS-standalone safe-area conditions on real-device geometry.
//   • This spec proves the SAME fix does not silently regress the
//     browser-mode layout (the bigger user surface — every visit to
//     metronome.jazzlore.com without an install).
//
// Decision (2026-05-27): the sticky footer stays in browser mode too,
// not just under standalone. The clipped-Start bug exists in browser
// on small phones — pinning Start is the right behavior everywhere.
// Browser-mode is therefore NOT byte-identical to the pre-#105 main;
// the baseline below freezes the new state.
//
// One representative mobile viewport (iPhone 15 393×852) is enough as
// a regression sentinel — the structural-fit harness already covers
// the device matrix.

import { test, expect } from '@playwright/test'

test('issue-105 browser baseline — iPhone-15 viewport, light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('http://localhost:5186/')
  await page.waitForSelector('.mt')

  // Settle: fonts + idle network. Idle metronome status, stopped.
  await page.waitForLoadState('networkidle')
  await page.evaluate(() =>
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready,
  )

  // Visual regression — MD5-match against the committed baseline at
  // `tests/e2e/metronome-issue-105-browser-baseline.spec.ts-snapshots/`.
  await expect(page).toHaveScreenshot('iphone-15-light-browser.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.001, // ~0.1% tolerance for sub-pixel jitter
  })

  // Structural fit-proof: even WITHOUT safe-area shim, Start sits
  // entirely within the viewport (no env() values active, so the
  // sticky-footer pins to the visible viewport bottom plus base
  // padding 14px). This is what makes the bug fix work in browser
  // mode too.
  const box = await page.locator('.start').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y + box!.height).toBeLessThanOrEqual(852)
})

test('issue-105 browser baseline — iPhone-15 viewport, dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('http://localhost:5186/')
  await page.waitForSelector('.mt')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() =>
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready,
  )

  await expect(page).toHaveScreenshot('iphone-15-dark-browser.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.001,
  })

  const box = await page.locator('.start').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y + box!.height).toBeLessThanOrEqual(852)
})
