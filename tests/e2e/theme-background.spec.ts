import { expect, test, type Page } from '@playwright/test'

/**
 * Regression guard for the "strange dark layer over the viewport" bug.
 *
 * The themed surface was applied only to each page's <main>, never to <html>.
 * The sticky header is translucent (bg .../78 + backdrop-blur), so in dark
 * mode the browser's white canvas bled through its 22% transparency, painting
 * a mismatched light band over the top of the viewport. The fix sets the
 * themed background on <html> (keyed on data-theme). This asserts the root
 * element actually carries an opaque, correctly-toned background in BOTH
 * themes — the exact signal the DOM probe used to find the bug
 * (documentElement background was rgba(0, 0, 0, 0), i.e. fully transparent).
 */

const PAGES = [
  { name: 'chords', baseURL: 'http://localhost:5174', path: '/chords/C' },
  { name: 'scales', baseURL: 'http://localhost:5173', path: '/scales/C' },
]

/**
 * Resolve <html>'s computed background to {r,g,b,a} via a 1px canvas so it is
 * robust to whatever colour syntax the engine serialises (rgb / oklch /
 * color()). Canvas fillStyle normalises any CSS colour; getImageData yields
 * 0..255 channels and a real alpha (0 ⇒ the transparent-root bug).
 */
function htmlBgRgba(page: Page): Promise<{ r: number; g: number; b: number; a: number }> {
  return page.evaluate(() => {
    const css = getComputedStyle(document.documentElement).backgroundColor
    const cv = document.createElement('canvas')
    cv.width = cv.height = 1
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return { r, g, b, a }
  })
}

const luminance = ({ r, g, b }: { r: number; g: number; b: number }) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255

function currentTheme(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

async function flipTheme(page: Page) {
  const before = await currentTheme(page)
  await page.getByRole('button', { name: 'Toggle theme' }).click()
  await expect.poll(() => currentTheme(page)).not.toBe(before)
}

for (const p of PAGES) {
  test.describe(`root background — ${p.name}`, () => {
    test.use({ baseURL: p.baseURL })

    test('html has an opaque, correctly-toned background in light AND dark', async ({
      page,
    }) => {
      await page.goto(p.path)
      await expect(
        page.getByRole('heading', { name: /C (chords|scales)/i }),
      ).toBeVisible()

      // Normalise to light first.
      if ((await currentTheme(page)) === 'dark') await flipTheme(page)

      // Light: opaque (the bug made the root fully transparent) and clearly light.
      const light = await htmlBgRgba(page)
      expect(light.a, 'html bg must be opaque, not transparent').toBe(255)
      expect(luminance(light)).toBeGreaterThan(0.85)

      await flipTheme(page)

      // Dark: opaque and clearly dark — no white canvas behind the
      // translucent header.
      const dark = await htmlBgRgba(page)
      expect(dark.a, 'html bg must be opaque, not transparent').toBe(255)
      expect(luminance(dark)).toBeLessThan(0.2)
    })
  })
}
