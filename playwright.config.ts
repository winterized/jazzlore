import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm -F @jazzlore/landing dev',
      url: 'http://localhost:5177',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm -F @jazzlore/scales dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm -F @jazzlore/chords dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm -F @jazzlore/musicians dev',
      url: 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm -F @jazzlore/metronome dev',
      url: 'http://localhost:5176',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    // PWA preview build — the dev server above has no service worker
    // (`devOptions.enabled: false` in vite.config.ts), so the PWA tests
    // run against a production build served by `vite preview` on its own
    // port. metronome-pwa.spec.ts hardcodes http://localhost:5186 as its
    // base URL.
    {
      command:
        'pnpm -F @jazzlore/metronome build && pnpm -F @jazzlore/metronome preview --port 5186 --strictPort',
      url: 'http://localhost:5186',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    // chords PWA preview — chords-pwa.spec.ts hardcodes :5184.
    {
      command:
        'pnpm -F @jazzlore/chords build && pnpm -F @jazzlore/chords preview --port 5184 --strictPort',
      url: 'http://localhost:5184',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
})
