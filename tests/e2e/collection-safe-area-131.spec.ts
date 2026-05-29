// Issue #131 — safe-area regression check for the collection pages.
//
// Both the Chords "My chord collection" (/collection/chords) and the Scales
// "My scales" (/collection/scales) pages render their own <main> and are NOT
// wrapped by StickyHeader, so each must apply env(safe-area-inset-*) itself.
// Before the fix their content ran under the notch / Dynamic Island (top) and
// the home indicator (bottom) on notched iPhones. This is an original-PWA CSS
// bug, not iOS-wrapper-specific. The two pages are symmetric and got the
// identical fix.
//
// Faithful shim (same approach as tests/e2e/metronome-issue-105.spec.ts):
// Playwright (chromium AND webkit, both desktop contexts) does NOT emit
// non-zero env(safe-area-inset-*), so the harness injects (a) an env()
// override driving the page's safe-area-padded <main> to the real device
// values, and (b) visible status-bar + home-indicator overlay rectangles so
// the geometry 1:1 models a real iPhone-in-standalone occlusion.
//
// Regression-proof division of labour: the served-DOM CLASS GUARD (below) is
// what goes red if a fix is reverted to plain p-4 — the shim forces padding
// via !important regardless of source, so the geometry assertions alone can't
// discriminate. The geometry assertions are the device-matrix VISUAL proof
// that content clears the safe area given realistic insets.

import { test, expect, type Page } from '@playwright/test'

const DEVICES = [
  { name: 'iphone-se',         viewport: { width: 375, height: 667 }, safeTop: 20, safeBottom:  0 },
  { name: 'iphone-13-mini',    viewport: { width: 375, height: 812 }, safeTop: 44, safeBottom: 34 },
  { name: 'iphone-15',         viewport: { width: 393, height: 852 }, safeTop: 47, safeBottom: 34 },
  { name: 'iphone-15-pro-max', viewport: { width: 430, height: 932 }, safeTop: 59, safeBottom: 34 },
] as const

// Each app's collection page. `seed` is enough rows to overflow the tallest
// viewport so the bottom inset is genuinely exercised. All ids exist in the
// respective curated data; store shapes mirror each collection store.
const APPS = [
  {
    name: 'chords',
    url: 'http://localhost:5174/collection/chords',
    storageKey: 'jazzlore:chords:v1',
    rowSelector: '[data-testid="chord-row"]',
    entries: [
      'maj', 'min', 'dim', 'aug', '6', 'm6', 'maj7', 'm7',
      '7', 'm7b5', 'dim7', 'maj9', 'm9', '9',
    ].map((chordId) => ({ rootNote: 'C', chordId, savedAt: '2026-01-01T00:00:00.000Z' })),
  },
  {
    name: 'scales',
    url: 'http://localhost:5173/collection/scales',
    storageKey: 'jazzlore:scales:v1',
    rowSelector: '.print-row',
    entries: [
      'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian',
      'melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant',
      'mixolydian-b6', 'altered', 'harmonic-minor',
    ].map((scaleId) => ({ rootNote: 'C', scaleId, savedAt: '2026-01-01T00:00:00.000Z' })),
  },
] as const

async function seedCollection(
  page: Page,
  storageKey: string,
  entries: ReadonlyArray<Record<string, string>>,
): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      window.localStorage.setItem(key, value)
    },
    { key: storageKey, value: JSON.stringify(entries) },
  )
}

// (a) env() override on the page's <main> (mobile base padding = 1rem) +
// (b) visible status-bar / home-indicator overlays. safeBottom === 0 (SE)
// makes the bottom overlay an invisible no-op.
async function applySafeAreaShim(
  page: Page,
  top: number,
  bottom: number,
): Promise<void> {
  await page.addStyleTag({
    content: `
      main {
        padding-top:    calc(1rem + ${top}px)    !important;
        padding-bottom: calc(1rem + ${bottom}px) !important;
      }
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

for (const app of APPS) {
  for (const d of DEVICES) {
    test(`issue-131 — ${app.name} collection safe-area — ${d.name}`, async ({ page }) => {
      await seedCollection(page, app.storageKey, app.entries)
      await page.setViewportSize(d.viewport)
      await page.goto(app.url)
      await page.waitForSelector(app.rowSelector)

      // Regression guard for the fix itself: the served <main> must carry the
      // env(safe-area-inset-*) padding classes. Fails if the fix is reverted
      // to plain p-4 — independent of the shim below (which forces padding via
      // !important to simulate device insets Chromium/WebKit can't emit).
      // Pin the property + side (pt-/pb-), not just the env() token, so a
      // mutation onto the wrong axis or onto margin still goes red.
      const mainClass = (await page.locator('main').getAttribute('class')) ?? ''
      expect(mainClass).toContain('pt-[calc(1rem+env(safe-area-inset-top')
      expect(mainClass).toContain('pb-[calc(1rem+env(safe-area-inset-bottom')

      await applySafeAreaShim(page, d.safeTop, d.safeBottom)
      // Settle for run-to-run geometry stability (parity with metronome-105).
      await page.waitForLoadState('networkidle')
      await page.evaluate(() =>
        (document as Document & { fonts?: FontFaceSet }).fonts?.ready,
      )

      // TOP: the page title must sit below the status-bar / Dynamic Island.
      const h1 = await page.locator('h1').boundingBox()
      expect(h1, 'page heading rendered with a bounding box').not.toBeNull()
      expect(
        h1!.y,
        `heading top edge (${h1!.y}) must be ≥ safeTop (${d.safeTop})`,
      ).toBeGreaterThanOrEqual(d.safeTop)

      // BOTTOM: scroll fully down, then the last row must clear the home
      // indicator — the bottom inset adds padding below the final row. Guard
      // against a vacuous pass: the page MUST actually overflow the viewport,
      // otherwise "last row above the home indicator" is trivially true with
      // zero bottom padding.
      const scrolls = await page.evaluate(() => {
        const el = document.documentElement
        const overflows = el.scrollHeight > el.clientHeight
        window.scrollTo(0, el.scrollHeight)
        return overflows
      })
      expect(scrolls, 'collection page must overflow the viewport so the bottom inset is exercised').toBe(true)
      const rows = page.locator(app.rowSelector)
      const lastRow = await rows.last().boundingBox()
      expect(lastRow, 'last row rendered with a bounding box').not.toBeNull()
      expect(
        lastRow!.y + lastRow!.height,
        `last row bottom edge (${lastRow!.y + lastRow!.height}) must be ≤ viewport - safeBottom (${d.viewport.height - d.safeBottom})`,
      ).toBeLessThanOrEqual(d.viewport.height - d.safeBottom)
    })
  }
}
