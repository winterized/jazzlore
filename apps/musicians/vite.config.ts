/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      // The static public/manifest.webmanifest is the canonical source —
      // do not let the plugin generate or inject one.
      manifest: false,
      includeManifestIcons: false,
      workbox: {
        // App shell only (hashed JS/CSS/HTML + fonts + icons). The BFF lives
        // under /api/* and is runtime-fetched, never matched here — offline
        // browsing of musician data is deliberately NOT a goal.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        // Never precache the SW or workbox runtime themselves (circular hash).
        globIgnores: ['**/*.map', 'sw.js', 'workbox-*.js'],
        // Mirror Cloudflare's not_found_handling: "single-page-application".
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/icons\//, /\.webmanifest$/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Take control of all clients on activation so a single reload after
        // first install brings the page under SW control deterministically —
        // and existing live users pick up fresh builds without being stranded.
        clientsClaim: true,
        skipWaiting: true,
      },
      // Dev server stays SW-free so existing e2e + visual baselines see the
      // same DOM as before. PWA behaviour is tested against vite preview.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5175,
  },
  test: {
    root: __dirname,
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'src/test/setup.ts')],
    css: true,
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  },
})
