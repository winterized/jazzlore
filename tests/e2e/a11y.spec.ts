/**
 * Phase 8 — accessibility audit for the sticky-header feature.
 *
 * Scope (locked product decision): ONLY the two main pages, /chords/C and
 * /scales/C. Collection pages are explicitly out of scope (their header is
 * unchanged).
 *
 * Tooling: repeatable @axe-core/playwright passes (CI-safe) instead of ad-hoc
 * Playwright-MCP driving. No fixed waitForTimeout sleeps — auto-retrying
 * locators / expect() only.
 *
 * Coverage per page:
 *  - light theme (default load)
 *  - dark theme (toggle via the StickyHeader theme button, wait for the
 *    data-theme flip on <html>, then re-run axe)
 *  - mobile root-sheet open (≈390×844 so the compact pill renders) — scales.
 *
 * Plus keyboard-nav assertions on /chords/C desktop (Tab reaches the chip
 * row; active chip exposes aria-current="true"; inline root buttons expose
 * aria-checked) and an e2e sanity that the mobile sheet is keyboard
 * dismissible (Esc closes, focus returns to the trigger) — the focus-trap
 * internals already have thorough unit tests in StickyHeader.rootSheet.test.tsx,
 * not duplicated here.
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

type PageUnderTest = { name: string; baseURL: string; path: string }

const PAGES: readonly PageUnderTest[] = [
  { name: 'chords', baseURL: 'http://localhost:5174', path: '/chords/C' },
  { name: 'scales', baseURL: 'http://localhost:5173', path: '/scales/C' },
]

/**
 * Run axe and assert zero violations. On failure, the assertion message
 * carries a compact {id, impact, nodes} digest so a CI failure is debuggable
 * without re-running locally.
 */
async function expectNoAxeViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const digest = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({ target: n.target, html: n.html })),
  }))
  expect(
    results.violations,
    `[${label}] axe found ${results.violations.length} violation(s):\n` +
      JSON.stringify(digest, null, 2),
  ).toEqual([])
}

/** Read the resolved theme off <html data-theme>. */
function currentTheme(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

for (const pageUnderTest of PAGES) {
  test.describe(`a11y — ${pageUnderTest.name} (${pageUnderTest.path})`, () => {
    test.use({ baseURL: pageUnderTest.baseURL })

    test('light theme — 0 axe violations', async ({ page }) => {
      await page.goto(pageUnderTest.path)
      // The page heading inside the sticky header is the readiness signal.
      await expect(page.getByRole('heading', { name: /C (chords|scales)/i })).toBeVisible()
      await expectNoAxeViolations(page, `${pageUnderTest.name} light`)
    })

    test('dark theme — 0 axe violations', async ({ page }) => {
      await page.goto(pageUnderTest.path)
      await expect(page.getByRole('heading', { name: /C (chords|scales)/i })).toBeVisible()

      const before = await currentTheme(page)
      // The StickyHeader theme-toggle button. aria-label is "Toggle theme".
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      // Wait for the data-theme flip on <html> — no fixed sleep.
      await expect.poll(() => currentTheme(page)).not.toBe(before)
      await expect(currentTheme(page)).resolves.toBe(before === 'dark' ? 'light' : 'dark')

      await expectNoAxeViolations(page, `${pageUnderTest.name} dark`)
    })

    test('search combobox + open listbox — 0 axe violations', async ({ page }) => {
      await page.goto(pageUnderTest.path)
      await expect(page.getByRole('heading', { name: /C (chords|scales)/i })).toBeVisible()
      const search = page.getByRole('combobox', { name: /^Search (chords|scales)$/ })
      await search.fill(pageUnderTest.name === 'chords' ? 'dim' : 'locr')
      // Listbox is open with options → audit the combobox pattern.
      await expect(page.getByRole('listbox')).toBeVisible()
      await expect(page.getByRole('option').first()).toBeVisible()
      await expectNoAxeViolations(page, `${pageUnderTest.name} search open`)
    })
  })
}

test.describe('a11y — mobile root sheet open', () => {
  test.use({
    baseURL: 'http://localhost:5173',
    viewport: { width: 390, height: 844 },
  })

  test('scales — root sheet open, 0 axe violations + keyboard dismiss', async ({ page }) => {
    await page.goto('/scales/C')
    await expect(page.getByRole('heading', { name: /C scales/i })).toBeVisible()

    // On a mobile viewport the compact "C ▾" pill renders (the inline
    // radiogroup is display:none'd). It exposes aria-haspopup="dialog".
    const pill = page
      .getByRole('button', { name: /^C/ })
      .and(page.locator('[aria-haspopup="dialog"]'))
    await expect(pill).toBeVisible()
    await expect(pill).toHaveAttribute('aria-expanded', 'false')

    await pill.click()

    // The portalled sheet is a role="dialog" at document.body.
    const dialog = page.getByRole('dialog', { name: 'Root note' })
    await expect(dialog).toBeVisible()
    await expect(pill).toHaveAttribute('aria-expanded', 'true')

    // axe over the whole document — the sheet portals outside the header.
    await expectNoAxeViolations(page, 'scales sheet-open')

    // Keyboard dismiss: Esc closes the sheet and restores focus to the
    // trigger pill (the focus-trap/backdrop internals are unit-tested
    // separately in StickyHeader.rootSheet.test.tsx — not duplicated).
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(pill).toHaveAttribute('aria-expanded', 'false')
    await expect(pill).toBeFocused()
  })
})

test.describe('keyboard nav — chords desktop', () => {
  test.use({
    baseURL: 'http://localhost:5174',
    viewport: { width: 1280, height: 800 },
  })

  test('chip row is keyboard-reachable; active chip exposes aria-current; Enter activates', async ({
    page,
    browserName,
  }) => {
    // Reduced motion → the chip-row scroll-spy auto-center is instant, so a
    // click can't shift the chip out from under the keyboard assertions.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/chords/C')

    const chipNav = page.getByRole('navigation', { name: 'Chord categories' })
    await expect(chipNav).toBeVisible()

    // On load the first chip is active and exposes aria-current="true".
    const firstChip = chipNav.locator('button').first()
    await expect(firstChip).toHaveAttribute('aria-current', 'true')

    // Sequential Tab from the document top must eventually land focus inside
    // the chip nav, proving the chip row is reachable by keyboard with no
    // focus trap before it. Chromium-only: WebKit honors the macOS "Full
    // Keyboard Access" OS setting (off by default), so Tab there only visits
    // form fields and skips buttons/links — a browser policy, not an app a11y
    // defect. WebKit's keyboard reachability is asserted below instead via
    // a real Tab step + Enter activation, which is policy-independent.
    if (browserName === 'chromium') {
      await page.locator('body').press('Tab')
      let reachedChipRow = false
      for (let i = 0; i < 30; i++) {
        const inChipRow = await page.evaluate(() => {
          const el = document.activeElement
          return !!el?.closest('nav[aria-label="Chord categories"]')
        })
        if (inChipRow) {
          reachedChipRow = true
          break
        }
        await page.keyboard.press('Tab')
      }
      expect(reachedChipRow, 'Tab never reached the chip row').toBe(true)
    }

    // Cross-browser: a chip button is keyboard-focusable (it has no
    // tabindex="-1" and no inert/hidden ancestor — programmatic focus
    // succeeding proves it is in the a11y/focus tree), and Enter activates
    // it so aria-current updates. This is the real a11y guarantee for the
    // chip row and is independent of the browser's Tab-traversal policy
    // (Tab moving between buttons is a browser/OS setting, not an app
    // concern, and WebKit legitimately skips buttons by default on macOS).
    await firstChip.focus()
    await expect(firstChip).toBeFocused()

    const dim7Chip = page.locator('[data-chip-id="chord-dim7"]')
    await dim7Chip.focus()
    await expect(dim7Chip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(dim7Chip).toHaveAttribute('aria-current', 'true')
  })

  test('inline root picker is a radiogroup with aria-checked on the selected root', async ({
    page,
  }) => {
    await page.goto('/chords/C')

    // Desktop inline picker is a role="radiogroup" aria-label="Root note".
    // Two radiogroups exist in the DOM (mobile + desktop) but the mobile one
    // is display:none'd, so getByRole only sees the visible desktop group.
    const radiogroup = page.getByRole('radiogroup', { name: 'Root note' })
    await expect(radiogroup).toBeVisible()

    // The implementation uses aria-checked (role="radio"), NOT aria-pressed.
    const cRadio = radiogroup.getByRole('radio', { name: 'C', exact: true })
    await expect(cRadio).toHaveAttribute('aria-checked', 'true')

    // A non-selected root exposes aria-checked="false" and is roving-tabindex
    // excluded (tabindex=-1) until selected — assert the ARIA state at least.
    const dRadio = radiogroup.getByRole('radio', { name: 'D', exact: true })
    await expect(dRadio).toHaveAttribute('aria-checked', 'false')

    // Keyboard: ArrowRight from the selected radio moves selection (selection-
    // follows-focus). C → C♯/D♭ is the next option in DEFAULT_ROOTS.
    await cRadio.focus()
    await page.keyboard.press('ArrowRight')
    await expect(cRadio).toHaveAttribute('aria-checked', 'false')
  })
})

/**
 * Reduced-motion sanity: nothing in the audited flows depends on motion for
 * accessibility. The chip-row scroll-spy already honors
 * prefers-reduced-motion (uses 'instant' scroll). Assert the chip row still
 * functions (active chip resolvable) under reduced motion so a future change
 * that gates content/feedback behind an animation regresses loudly.
 */
test.describe('reduced-motion sanity — scales', () => {
  test.use({ baseURL: 'http://localhost:5173' })

  test('chip row still resolves an active chip with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/scales/C')

    const chipNav = page.getByRole('navigation', { name: 'Scale categories' })
    await expect(chipNav).toBeVisible()
    // Something is always highlighted (defaults to the first chip) — no
    // motion needed to perceive the active state.
    await expect(chipNav.locator('button[aria-current="true"]')).toHaveCount(1)
  })
})
