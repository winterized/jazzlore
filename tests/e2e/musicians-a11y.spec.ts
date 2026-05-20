/**
 * Phase D — musicians mobile-reader accessibility audit + visual baselines.
 *
 * Tooling mirrors the proven repo `a11y.spec.ts`: repeatable
 * @axe-core/playwright passes (CI-safe), no fixed sleeps — auto-retrying
 * locators / expect() only. Theme is flipped via the @jazzlore/ui
 * ThemeToggle (aria-label "Toggle theme"); we wait for the data-theme flip
 * on <html> before re-auditing.
 *
 * Views (each ×2 themes): home, detail rich (Miles), detail sparse
 * (Antoine), autosuggest listbox open, "More about" sheet open, waking
 * cold-Aura screen. Visual baselines are captured for the same views at
 * mobile 390 and desktop 1280 (incl. desktop-with-graph) into
 * apps/musicians/docs/baseline/ (NOT baselines/ — the root .gitignore
 * swallows that name; Phase E used docs/graph-baseline/ for the same reason).
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mockBff } from './musicians-bff-mock'

// BASE is parameterized so the same spec can audit (a) the localhost dev
// server with a route-stubbed BFF (the historical mode) OR (b) a live
// preview/prod URL that serves the REAL BFF (joint-fix acceptance mode).
// IS_LIVE_BFF gates two things: which Antoine ID to use (the test fixture's
// Q2856321 is a CODEBASE-INTERNAL test double — woven into worker/test-
// fixtures.ts, duplicates.test.ts, etc.; the live Aura DB carries Antoine
// Hervé at Q586360, verified 2026-05-19) and whether mockBff is installed
// (skipped in live mode so we audit real data, not mock data).
const BASE = process.env.BASE ?? 'http://localhost:5175'
// Live BFF = unambiguous HTTPS (musicians.jazzlore.com + Cloudflare previews).
// Any http://... (including 127.0.0.1, 0.0.0.0, *.local, localhost) is local —
// keeps mockBff installed and the fixture Antoine ID active. Code review
// caught the earlier `!startsWith('http://localhost')` heuristic flipping into
// live mode for 127.0.0.1 etc. — silent regression.
const IS_LIVE_BFF = /^https:\/\//.test(BASE)
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const MILES = '/musicians/wikidata:Q93341' // RICH — same ID in fixture and live
const ANTOINE_ID = IS_LIVE_BFF ? 'wikidata:Q586360' : 'wikidata:Q2856321'
const ANTOINE = `/musicians/${ANTOINE_ID}` // SPARSE — fixture vs live (see above)
const WAKING = '/musicians/__preview/waking' // dev-only harness route (no live equivalent)

/**
 * Phase-B token layer was REVISED (user-authorised) to close the WCAG AA
 * color-contrast gap the Phase-D axe pass found: pass-5's `--accent` /
 * `--dim` measured 2.2–3.2:1 on the paper/ink surfaces. The fix split
 * decorative vs text/UI accent — `--accent`/`--accent-soft` stay vivid for
 * decorative-only use, a new AA-compliant `--accent-strong` carries all
 * accent text / links / focus / active / CTA-bg, and `--dim` was retargeted
 * to the `--muted` value. The token layer is RE-FROZEN. There is therefore
 * NO LONGER a suppressed exception: this suite asserts ZERO axe violations
 * of EVERY rule, `color-contrast` INCLUDED, in both themes. See
 * .omc/notepads/2026-05-18-musicians-v1/phase-D-learnings.md.
 */
async function expectNoAxe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const digest = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({ target: n.target, html: n.html })),
  }))
  expect(
    results.violations,
    `[${label}] axe found ${results.violations.length} violation(s) ` +
      `(color-contrast included — no suppressed exception):\n` +
      JSON.stringify(digest, null, 2),
  ).toEqual([])
}

function theme(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

/** Flip the theme via the toggle and wait for the <html data-theme> flip.
 *  The header toggle moved INSIDE the "···" overflow menu (Group C item 7).
 *  The waking-state preview still renders a bare `<ThemeToggleButton />`
 *  with no overflow wrapper, so we conditionally open the menu only when
 *  it's present. */
async function flipTheme(page: Page): Promise<void> {
  const before = await theme(page)
  const more = page.getByRole('button', { name: 'More options' })
  if (await more.count()) await more.first().click()
  await page.getByRole('button', { name: 'Toggle theme' }).click()
  await expect.poll(() => theme(page)).not.toBe(before)
}

test.use({ baseURL: BASE })

// The SPA now calls `/api/musicians/*` through the production `httpSource`
// (the H1 seam swap); the Vite dev server has no `/api/*`, so localhost
// audited views need the frozen-shaped mock or they'd only audit the calm
// error state. In LIVE-BFF mode (BASE is a preview/prod URL) we skip the
// mock so we audit real data — the whole point of targeting prod.
test.beforeEach(async ({ page }) => {
  if (!IS_LIVE_BFF) await mockBff(page)
})

// Live-BFF mode requires a hint to skip the WAKING preview route (it's
// localhost-dev-only — no equivalent on a deployed environment).
const SKIP_WAKING_VIEW = IS_LIVE_BFF

type View = { name: string; ready: (p: Page) => Promise<void> }

/** Drive each view to its audited state (light theme, default load). */
const VIEWS: Record<string, View> = {
  home: {
    name: 'home',
    ready: async (p) => {
      await p.goto('/musicians')
      await expect(
        p.getByRole('heading', { level: 1, name: /step into a musician/i }),
      ).toBeVisible()
    },
  },
  'detail-rich': {
    name: 'detail-rich',
    ready: async (p) => {
      await p.goto(MILES)
      await expect(
        p.getByRole('heading', { level: 1, name: /miles davis/i }),
      ).toBeVisible()
    },
  },
  'detail-sparse': {
    name: 'detail-sparse',
    ready: async (p) => {
      await p.goto(ANTOINE)
      await expect(
        p.getByRole('heading', { level: 1, name: /antoine herv/i }),
      ).toBeVisible()
    },
  },
  waking: {
    name: 'waking',
    ready: async (p) => {
      await p.goto(WAKING)
      await expect(
        p.getByRole('heading', { level: 1, name: /waking up/i }),
      ).toBeVisible()
    },
  },
}

for (const view of Object.values(VIEWS)) {
  // Skip the dev-only waking preview when targeting a live BFF.
  if (SKIP_WAKING_VIEW && view.name === 'waking') continue
  test.describe(`a11y — ${view.name}`, () => {
    test('light theme — 0 axe violations', async ({ page }) => {
      await view.ready(page)
      await expectNoAxe(page, `${view.name} light`)
    })

    test('dark theme — 0 axe violations', async ({ page }) => {
      await view.ready(page)
      await flipTheme(page)
      await expectNoAxe(page, `${view.name} dark`)
    })
  })
}

test.describe('a11y — autosuggest listbox open', () => {
  // Open the portalled listbox with real keystrokes (focus then type) and
  // let the 80ms debounce settle before auditing the combobox popup.
  async function openListbox(page: Page): Promise<void> {
    const box = page.getByRole('combobox', { name: /search a musician/i })
    await box.click()
    await box.pressSequentially('mile', { delay: 40 })
    await expect(page.getByRole('listbox')).toBeVisible()
    await expect(page.getByRole('option').first()).toBeVisible()
  }

  test('light — 0 axe violations', async ({ page }) => {
    await page.goto('/musicians')
    await openListbox(page)
    await expectNoAxe(page, 'autosuggest light')
  })

  test('dark — 0 axe violations', async ({ page }) => {
    await page.goto('/musicians')
    // Flip BEFORE opening — re-typing after a theme flip is more brittle
    // than auditing the popup once, in the target theme.
    await flipTheme(page)
    await openListbox(page)
    await expectNoAxe(page, 'autosuggest dark')
  })
})

test.describe('a11y — More about sheet open', () => {
  async function openSheet(page: Page): Promise<void> {
    await expect(
      page.getByRole('heading', { level: 1, name: /miles davis/i }),
    ).toBeVisible()
    await page.getByRole('link', { name: /more about miles/i }).click()
    await expect(
      page.getByRole('dialog', { name: /more about miles/i }),
    ).toBeVisible()
  }

  test('light — 0 axe violations', async ({ page }) => {
    await page.goto(MILES)
    await openSheet(page)
    await expectNoAxe(page, 'sheet light')
  })

  test('dark — 0 axe violations', async ({ page }) => {
    await page.goto(MILES)
    // The sheet is an aria-modal dialog with a focus trap — the header
    // theme toggle is (correctly) unreachable while it is open, so the
    // theme must be flipped BEFORE the sheet is opened.
    await expect(
      page.getByRole('heading', { level: 1, name: /miles davis/i }),
    ).toBeVisible()
    await flipTheme(page)
    await openSheet(page)
    await expectNoAxe(page, 'sheet dark')
  })
})
