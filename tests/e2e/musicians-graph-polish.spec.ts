// Graph polish (desktop) · unattended live-prod verification.
//
// Runs against the deployed musicians worker via PREVIEW_BASE; skipped
// when unset (same gate idiom as `musicians-joint-fix-acceptance.spec.ts`
// and `musicians-no-photo-figures.spec.ts`). Each test spawns a short-
// lived browser and tears it down — the long-lived Playwright MCP
// browser is not involved.
//
// Assertions (regression-safe):
//   1. The graph SVG renders at desktop viewport (≥1024) — sanity that
//      the desktop-only graph hasn't broken.
//   2. Peripheral nodes carry a `mu-family-<key>` class — the family
//      colour wiring landed.
//   3. The central node (.mu-gnode-focus) does NOT carry a family class
//      — the accent treatment is preserved.
//
// Screenshots (the deliverable you review for hue tuning):
//   Captured to `tests/e2e/screenshots/graph-polish/` at 1280×800 in
//   BOTH themes. A best-effort hover-state capture focuses the first
//   peripheral node and screenshots the revealed name + sub-instrument.
//   Filenames are deterministic so re-runs overwrite the same artefacts;
//   screenshots are committed in a follow-up after the first prod run
//   creates them (same flow as Wave 2a no-photo).
import { test, expect, type Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PREVIEW_BASE = process.env['PREVIEW_BASE']
const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'screenshots', 'graph-polish')

const MILES = 'wikidata:Q93341'

test.describe('Graph polish · live prod (desktop)', () => {
  test.skip(!PREVIEW_BASE, 'PREVIEW_BASE unset — skipping live-prod gate')

  test.beforeAll(async () => {
    await fs.mkdir(SHOTS, { recursive: true })
  })

  async function gotoMiles(page: Page): Promise<void> {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${PREVIEW_BASE}/musicians/${MILES}`)
    // Wait for the graph SVG to mount — the graph is desktop-only and
    // lazy-loaded inside GraphPanelSlot.
    await page.waitForSelector('.mu-graph svg, svg.mu-graph-svg', {
      timeout: 30_000,
    })
    // Settle the force layout (the initial layout snaps fast under
    // reduced-motion; one frame is enough on prod hardware).
    await page.waitForTimeout(800)
  }

  async function setTheme(page: Page, theme: 'dark' | 'light'): Promise<void> {
    // The musicians app reads the theme from localStorage key 'theme:v1'
    // (@jazzlore/music-core `applyTheme`) and sets `data-theme` on <html>.
    // Apply BOTH the storage write AND the attribute directly so the
    // light theme actually takes effect — relying on the reload alone
    // produced byte-identical dark/light screenshots in an earlier run.
    await page.evaluate((t) => {
      localStorage.setItem('theme:v1', t)
      document.documentElement.setAttribute('data-theme', t)
    }, theme)
    // Give the CSS layer one frame to repaint with the new var values.
    await page.waitForTimeout(200)
  }

  // ── Assertions ───────────────────────────────────────────────────
  test('graph renders at desktop viewport', async ({ page }) => {
    await gotoMiles(page)
    const nodeCount = await page.locator('.mu-gnode').count()
    expect(
      nodeCount,
      'graph must render at least the central node + peers',
    ).toBeGreaterThan(1)
  })

  test('peripheral nodes carry a mu-family-<key> class', async ({ page }) => {
    await gotoMiles(page)
    // Find at least one peripheral with a family class — exact key varies
    // by Miles' collaborator instruments, so accept any of the 7 keys.
    const familyCount = await page
      .locator(
        '.mu-gnode.mu-family-brass, .mu-gnode.mu-family-reeds, .mu-gnode.mu-family-strings, .mu-gnode.mu-family-keys, .mu-gnode.mu-family-percussion, .mu-gnode.mu-family-voice, .mu-gnode.mu-family-unknown',
      )
      .count()
    expect(
      familyCount,
      'at least one peripheral node must carry a mu-family-<key> class',
    ).toBeGreaterThan(0)
  })

  test('central node does NOT carry a family class (accent treatment preserved)', async ({
    page,
  }) => {
    await gotoMiles(page)
    // The central node is `.mu-gnode-focus`; it must not also carry any
    // family class — family colour is for the orbit, not the anchor.
    const focusFamilyCount = await page
      .locator(
        '.mu-gnode-focus.mu-family-brass, .mu-gnode-focus.mu-family-reeds, .mu-gnode-focus.mu-family-strings, .mu-gnode-focus.mu-family-keys, .mu-gnode-focus.mu-family-percussion, .mu-gnode-focus.mu-family-voice, .mu-gnode-focus.mu-family-unknown',
      )
      .count()
    expect(focusFamilyCount).toBe(0)
  })

  // ── Screenshots ──────────────────────────────────────────────────
  // The screenshots are the iteration artefact for the 6 family hues
  // + AA-contrast validation on the in-circle monogram. The behavioural
  // assertions above are the regression guard; the screenshots inform
  // palette tuning.
  for (const theme of ['dark', 'light'] as const) {
    test(`screenshot · Miles graph · ${theme}`, async ({ page }) => {
      await gotoMiles(page)
      await setTheme(page, theme)
      // Screenshot the whole .mu-graph panel rather than the page so the
      // crop is consistent across themes.
      const panel = page.locator('.mu-graph').first()
      await panel.screenshot({
        path: join(SHOTS, `miles-graph-${theme}.png`),
      })
    })

    test(`screenshot · Miles graph · focus reveal · ${theme}`, async ({
      page,
    }) => {
      await gotoMiles(page)
      await setTheme(page, theme)
      // Best-effort focus a peripheral node to reveal its label/sub.
      // Playwright `focus()` on an SVG `<g role="button">` can be flaky;
      // if it doesn't fire, we still produce a screenshot — the
      // behavioural assertion lives in the unit suite.
      const peripheral = page
        .locator('.mu-gnode:not(.mu-gnode-focus)')
        .first()
      try {
        await peripheral.focus({ timeout: 2000 })
      } catch {
        // ignore — best-effort
      }
      await page.waitForTimeout(200)
      const panel = page.locator('.mu-graph').first()
      await panel.screenshot({
        path: join(SHOTS, `miles-graph-focus-${theme}.png`),
      })
    })
  }
})
