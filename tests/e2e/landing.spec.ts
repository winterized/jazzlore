import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:5177'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const

const THEMES = ['light', 'dark'] as const

/** Hydrate the theme override BEFORE navigation so the first paint matches
 *  the requested theme. Goes through the same storage key
 *  @jazzlore/music-core uses ('jazzlore:theme:v1', JSON-stringified). */
async function gotoWithTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    window.localStorage.setItem('jazzlore:theme:v1', JSON.stringify(t))
  }, theme)
  await page.goto(BASE)
}

test.describe('landing — idle render', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`renders all 4 tiles at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await gotoWithTheme(page, theme)

        await expect(page).toHaveTitle(
          /Jazzlore — A jazz musician's workbench/,
        )

        // Header wordmark
        await expect(page.getByText('Jazzlore', { exact: true })).toBeVisible()
        await expect(
          page.getByText('a workbench', { exact: true }),
        ).toBeVisible()

        // Utilitarian explanation line (NOT the About copy — that lives in
        // the modal only).
        await expect(
          page.getByText(/A jazz musician's workbench — explore who played/),
        ).toBeVisible()

        // All 4 tile titles render
        await expect(
          page.locator('.jzl-tile-chrome-title', { hasText: /^Musicians$/i }),
        ).toBeVisible()
        await expect(
          page.locator('.jzl-tile-chrome-title', { hasText: /^Scales$/i }),
        ).toBeVisible()
        await expect(
          page.locator('.jzl-tile-chrome-title', { hasText: /^Chords$/i }),
        ).toBeVisible()
        await expect(
          page.locator('.jzl-tile-chrome-title', { hasText: /^Metronome$/i }),
        ).toBeVisible()

        // The hero h2
        await expect(
          page.getByRole('heading', { name: 'Who played with whom.' }),
        ).toBeVisible()

        // Theme actually applied to <html>
        await expect(page.locator('html')).toHaveAttribute(
          'data-theme',
          theme,
        )
      })
    }
  }
})

test.describe('landing — subdomain visibility rule', () => {
  test('desktop: ALL 4 tiles show their subdomain in chrome', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoWithTheme(page, 'light')
    await expect(page.getByText('musicians.jazzlore.com')).toBeVisible()
    await expect(page.getByText('scales.jazzlore.com')).toBeVisible()
    await expect(page.getByText('chords.jazzlore.com')).toBeVisible()
    await expect(page.getByText('metronome.jazzlore.com')).toBeVisible()
  })

  test('mobile: ONLY Musicians shows its subdomain; the 3 small tiles do NOT', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoWithTheme(page, 'light')
    await expect(page.getByText('musicians.jazzlore.com')).toBeVisible()
    // Hard rule: cramming "scales.jazzlore.com" into a 111px-wide tile
    // chrome clips it — handoff says these three render NOTHING top-right
    // on mobile. Negative assertion guards regressions.
    await expect(page.getByText('scales.jazzlore.com')).toHaveCount(0)
    await expect(page.getByText('chords.jazzlore.com')).toHaveCount(0)
    await expect(page.getByText('metronome.jazzlore.com')).toHaveCount(0)
  })
})

test.describe('landing — tile links', () => {
  test('each tile is an <a> to its subdomain', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoWithTheme(page, 'light')

    // Each tile is a <a class="jzl-tile">. The chrome title carries the
    // accessible name, so role=link + name=… is a stable selector.
    await expect(
      page.getByRole('link', { name: /Musicians/i }).first(),
    ).toHaveAttribute('href', 'https://musicians.jazzlore.com')
    await expect(
      page.getByRole('link', { name: /Scales/i }).first(),
    ).toHaveAttribute('href', 'https://scales.jazzlore.com')
    await expect(
      page.getByRole('link', { name: /Chords/i }).first(),
    ).toHaveAttribute('href', 'https://chords.jazzlore.com')
    await expect(
      page.getByRole('link', { name: /Metronome/i }).first(),
    ).toHaveAttribute('href', 'https://metronome.jazzlore.com')
  })
})

test.describe('landing — About overlay', () => {
  test('opens, shows verbatim copy, closes on backdrop / × / Esc', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoWithTheme(page, 'light')

    // Not visible until About is clicked
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Verbatim phrases from the handoff — DO NOT paraphrase. Splitting the
    // assertion across two predicates because the italicized "Musicians is
    // different" lives in its own <em> and Playwright's text-content
    // matcher reads it as a separate token.
    await expect(
      page.getByText(/I built these tools for myself/),
    ).toBeVisible()
    await expect(
      page.getByText('Musicians is different', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText(
        /This is personal; it doesn't aspire to be the right fit for everyone/,
      ),
    ).toBeVisible()

    // Esc closes
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Re-open + backdrop click closes
    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // Backdrop is a viewport-filling <button aria-label="Close"> sibling
    // of the dialog. Its centroid sits BEHIND the dialog panel (the panel
    // is z-indexed above), so Playwright's default centroid-click would
    // be intercepted by the panel. Click at an offset corner instead —
    // the (x:10, y:10) point lands in clear backdrop space.
    await page
      .getByRole('button', { name: 'Close', exact: true })
      .click({ position: { x: 10, y: 10 } })
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Re-open + × close button closes
    await page.getByRole('button', { name: 'About' }).click()
    await page.getByRole('button', { name: 'Close About' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('landing — theme toggle round-trip', () => {
  test('toggle flips data-theme + writes to localStorage', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoWithTheme(page, 'light')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('jazzlore:theme:v1'),
    )
    expect(stored).toBe('"dark"')
  })

  test('toggle persists across reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Intentionally NO init script — addInitScript re-runs on every
    // navigation including reload, so we can't measure persistence
    // with it on. Start from whatever the headless default is, toggle,
    // then reload and check the toggled value survives.
    await page.goto(BASE)
    const initial = await page.locator('html').getAttribute('data-theme')
    const toggled = initial === 'dark' ? 'light' : 'dark'

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      toggled,
    )

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      toggled,
    )
  })
})

test.describe('landing — axe-core', () => {
  for (const theme of THEMES) {
    test(`0 violations at desktop ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await gotoWithTheme(page, theme)
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })
  }
})
