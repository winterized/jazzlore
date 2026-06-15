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
        // Includes hashed JS chunks (incl. lazy abcjs + Tone.js bundles) +
        // CSS + html + icons + manifest + Salamander piano samples.
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webmanifest,woff2,mp3,ogg,m4a}',
        ],
        // Never precache the SW or workbox runtime themselves (circular hash).
        globIgnores: ['**/*.map', 'sw.js', 'workbox-*.js'],
        // Mirror Cloudflare's not_found_handling: "single-page-application"
        // so React Router's /scales/:root + /collection/scales routes load
        // offline with the same fallback shape they have online.
        navigateFallback: '/index.html',
        // /sitemap.xml + /robots.txt are real files served by Cloudflare Static
        // Assets — keep them OFF the index.html navigation fallback so an
        // installed PWA returns the file, not the cached app shell (§13 of the
        // SEO audit). Googlebot runs no SW, so this only fixes manual/browser
        // checks; it does not affect crawling.
        navigateFallbackDenylist: [
          /^\/icons\//,
          /^\/audio\//,
          /\.webmanifest$/,
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
        ],
        // Bumped to 6 MiB to comfortably cover Salamander piano sample
        // sizes (Tone.js lazy chunk ~340 KB, abcjs lazy chunk ~500 KB,
        // audio samples up to a few MB across all C/A pitches).
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Take control of all clients on activation so a single reload after
        // first install brings the page under SW control deterministically.
        clientsClaim: true,
        skipWaiting: true,
      },
      // Dev server stays SW-free so existing e2e + visual baselines see the
      // same DOM as before. PWA behaviour is tested against vite preview.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
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
