// Shared e2e helper — flip the musicians-app theme deterministically.
//
// Mirrors the on-disk shape of `@jazzlore/music-core`'s storage seam:
//   - actual localStorage key is `jazzlore:theme:v1` (the `jazzlore:` prefix
//     is added by `packages/music-core/src/storage.ts`; bare `theme:v1` is
//     the in-source KEY constant, not the persisted key)
//   - value is `JSON.stringify(theme)` so `read<Theme>` parses it back
//
// Also flips `data-theme` on <html> directly so the current paint repaints
// without a reload — the token layer + duotone palette react to that attr.
//
// Past bug pattern this prevents (issue #79): writing `localStorage.setItem(
// 'mu3-theme', t)` OR `localStorage.setItem('theme:v1', t)` is a silent
// no-op. The persisted-override never resolves on subsequent reads, so any
// reload-driven spec falls back to the system theme. The `data-theme` set
// side-steps that for the immediate paint but leaves the override broken.
import type { Page } from '@playwright/test'

export type Theme = 'dark' | 'light'

export async function setMusiciansTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => {
    localStorage.setItem('jazzlore:theme:v1', JSON.stringify(t))
    document.documentElement.setAttribute('data-theme', t)
  }, theme)
  // One frame for the CSS layer to repaint with the new var values.
  await page.waitForTimeout(200)
}
