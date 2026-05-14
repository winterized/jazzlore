import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './apps/scales/vite.config.ts',
  './packages/music-core/vitest.config.ts',
])
