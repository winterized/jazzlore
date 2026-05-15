import { expect, test } from '@playwright/test'

test.use({ baseURL: 'http://localhost:5173' })

test('scale notation does not overlap the piano keyboard', async ({ page }) => {
  // Regression: abcjs writes inline `overflow: hidden; height: <Npx>` on its host.
  // With paddingtop/paddingbottom defaulted to 0, the SVG's bottom edge was
  // clipped to the host's height and the keyboard sat against it — chopping
  // the lower portion of the noteheads. The fix is to give abcjs vertical
  // padding inside the SVG so its own height includes breathing room.
  await page.goto('/scales/C')
  const article = page.locator('article').first()
  // Wait for both SVGs to be rendered (abcjs is lazy-loaded).
  await expect(article.locator('svg[aria-label="Sheet Music"]')).toBeVisible()
  await expect(article.locator('svg[aria-label*="keyboard" i]')).toBeVisible()

  const overlap = await article.evaluate((a) => {
    const score = a.querySelector('svg[aria-label="Sheet Music"]')
    const kb = a.querySelector('svg[aria-label*="keyboard" i]')
    if (!score || !kb) return null
    const s = score.getBoundingClientRect()
    const k = kb.getBoundingClientRect()
    return s.bottom - k.top
  })
  // Allow a 1px rounding tolerance; anything beyond means the notation is
  // bleeding into the keyboard space.
  expect(overlap).not.toBeNull()
  expect(overlap!).toBeLessThanOrEqual(1)
})

test('pick C, save Dorian, see it in collection, print preview', async ({ page }) => {
  await page.goto('/scales/C')

  // Picker shows C as selected
  await expect(page.getByRole('radio', { name: 'C' })).toHaveAttribute('aria-checked', 'true')

  // Save Dorian via star
  const dorianRow = page.locator('article', { hasText: 'Dorian' }).first()
  await dorianRow.getByRole('button', { name: /Save to My scales/i }).click()

  // Navigate to collection
  await page.goto('/collection/scales')

  // Dorian heading should be visible there
  await expect(page.getByRole('heading', { name: /^Dorian$/ })).toBeVisible()

  // Print preview: emulate print media
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-grid')).toBeVisible()
  // Regression: print.css used to strip every <header> element, which silently
  // swallowed each scale's name (it lives inside an <article><header>...). The
  // strip rule must keep article headers visible.
  await expect(page.getByRole('heading', { name: /^Dorian$/ })).toBeVisible()
})
