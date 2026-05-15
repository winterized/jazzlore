import { expect, test } from '@playwright/test'

test.use({ baseURL: 'http://localhost:5173' })

test('root redirects to /scales/C', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/scales\/C$/)
  await expect(page.getByRole('heading', { name: /C scales/i })).toBeVisible()
})

test('invalid root redirects to /scales/C', async ({ page }) => {
  await page.goto('/scales/H')
  await expect(page).toHaveURL(/\/scales\/C$/)
  await expect(page.getByRole('heading', { name: /C scales/i })).toBeVisible()
})
