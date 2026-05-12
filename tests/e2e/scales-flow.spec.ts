import { expect, test } from '@playwright/test'

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
})
