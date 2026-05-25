// Type augmentation: extends vitest's Assertion with jest-dom matchers
import type {} from '@testing-library/jest-dom/vitest'
// Runtime registration: must import from local vitest to avoid the dual-instance
// issue in pnpm workspaces where the pnpm-store's jest-dom resolves a different
// vitest than the one running the worker.
import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

// Polyfill localStorage / sessionStorage when the host env doesn't expose them
// as globals (Node 26 + jsdom 29 + vitest 4 don't currently globalize them).
const makeStorage = (): Storage => {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: makeStorage(),
    configurable: true,
    writable: true,
  })
}
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: makeStorage(),
    configurable: true,
    writable: true,
  })
}

// matchMedia polyfill — jsdom 29 doesn't ship it. useBreakpoint (or any
// responsive hook) returns the desktop default when this stub is used.
if (typeof globalThis.matchMedia === 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  })
}
