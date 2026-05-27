// Metronome — Issue #105 A/B prototype screenshot harness.
//
// Captures viewport-only screenshots of the metronome standalone PWA
// across a 5-device matrix (SE → Pro Max + an Android). Identical
// across both prototype branches (fix/105-grid and fix/105-sticky-footer);
// the ONLY difference between the two screenshot sets is the layout
// fix being prototyped on each branch.
//
// Faithful shim: Playwright/Chromium does NOT emit
// `env(safe-area-inset-*)` from device emulation. The harness injects
// (a) an env() shim that drives the page's safe-area-padded selectors
// to the real device values, and (b) visible status-bar +
// home-indicator overlay rectangles so the screenshot 1:1 models the
// real iPhone-in-standalone occlusion. The structural assertion
// (start.y >= safeTop && start.y + height <= viewport.height -
// safeBottom) is the meaningful "Start fits on the real device"
// proof — verified against the user's physical Pro Max by a
// calibration shot before the small-phone cases are trusted.
//
// Output: /tmp/jazzlore-105/<OPTION_LABEL>-<device>.png. After both
// branches run, `tests/e2e/screenshots-issue-105-composite.mjs`
// stitches them into per-option strips + per-device A/B pairs.

import { test, expect, type Page } from '@playwright/test'

const DEVICES = [
  { name: 'iphone-se',         viewport: { width: 375, height: 667 }, safeTop: 20, safeBottom:  0 },
  { name: 'iphone-13-mini',    viewport: { width: 375, height: 812 }, safeTop: 44, safeBottom: 34 },
  { name: 'iphone-15',         viewport: { width: 393, height: 852 }, safeTop: 47, safeBottom: 34 },
  { name: 'iphone-15-pro-max', viewport: { width: 430, height: 932 }, safeTop: 59, safeBottom: 34 },
  { name: 'android-pixel-5',   viewport: { width: 393, height: 851 }, safeTop: 24, safeBottom: 15 },
] as const

// Reused VERBATIM from `tests/e2e/pwa-install.spec.ts:43-64` — patches
// `window.matchMedia` BEFORE the SPA mounts so React sees
// `display-mode: standalone` on first render.
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

// Two-part shim:
//   (a) env() override on the specific selectors PR #104 added env() to
//       (plus `.mt .start-footer` for Option 4 — harmless when absent).
//   (b) Visible status-bar + home-indicator overlay rectangles so the
//       screenshot models the OS-occluded regions of a real iPhone in
//       standalone PWA mode. SafeBottom === 0 (SE) → invisible no-op.
async function applySafeAreaShim(
  page: Page,
  top: number,
  bottom: number,
): Promise<void> {
  await page.addStyleTag({
    content: `
      .mt .hdr          { padding-top: calc(12px + ${top}px) !important; }
      .mt .wkwv-banner  { top: calc(56px + ${top}px)         !important; }
      .mt .start-footer { padding-bottom: calc(14px + ${bottom}px) !important; }

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

const OPTION_LABEL = process.env.OPTION_LABEL ?? 'unset'
const OUT_DIR = process.env.SCREENSHOT_DIR ?? '/tmp/jazzlore-105'
// COLOR_SCHEME=dark forces prefers-color-scheme: dark via Playwright's
// emulateMedia. The metronome's `resolveInitialTheme()`
// (`packages/music-core/src/theme.ts:25`) reads this on first paint, so
// data-theme="dark" lands before the SPA mounts. Default = light.
const COLOR_SCHEME =
  process.env.COLOR_SCHEME === 'dark' ? 'dark' : 'light'

for (const d of DEVICES) {
  test(`issue-105 — ${OPTION_LABEL} — ${d.name}`, async ({ page }) => {
    await setStandaloneEmulation(page)
    await page.emulateMedia({ colorScheme: COLOR_SCHEME })
    await page.setViewportSize(d.viewport)
    await page.goto('http://localhost:5186/')
    await page.waitForSelector('.mt')
    await applySafeAreaShim(page, d.safeTop, d.safeBottom)

    // Settle: wait for fonts + idle network. Idle metronome status,
    // stopped — same app state for every shot.
    await page.waitForLoadState('networkidle')
    await page.evaluate(() =>
      (document as Document & { fonts?: FontFaceSet }).fonts?.ready,
    )

    // Viewport-only screenshot (NOT fullPage) — the whole point is to
    // verify "Start above the fold". Dark-mode shots carry a `-dark`
    // suffix so they don't collide with the default light-mode set;
    // light-mode shots keep the bare filename so the composite script
    // doesn't need to know about the COLOR_SCHEME variable.
    const themeSuffix = COLOR_SCHEME === 'dark' ? '-dark' : ''
    await page.screenshot({
      path: `${OUT_DIR}/${OPTION_LABEL}${themeSuffix}-${d.name}.png`,
      fullPage: false,
    })

    // Permanent regression check (issue #105). Start MUST sit entirely
    // between the safe-area edges — failure on EITHER bound means the
    // button is occluded on a real iPhone in standalone PWA mode. Hard
    // `expect` so a future layout-touching PR that regresses Start's
    // visibility fails CI fast. Each device is its own `test()`, so
    // one device's failure doesn't stop the others from running and
    // reporting their independent box coordinates.
    const box = await page.locator('.start').boundingBox()
    expect(box, 'Start button rendered with a bounding box').not.toBeNull()
    expect(
      box!.y,
      `Start top edge (${box!.y}) must be ≥ safeTop (${d.safeTop})`,
    ).toBeGreaterThanOrEqual(d.safeTop)
    expect(
      box!.y + box!.height,
      `Start bottom edge (${box!.y + box!.height}) must be ≤ viewport - safeBottom (${d.viewport.height - d.safeBottom})`,
    ).toBeLessThanOrEqual(d.viewport.height - d.safeBottom)
  })
}
