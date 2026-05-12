import '@testing-library/jest-dom/vitest'

// Polyfill localStorage / sessionStorage when the host env doesn't expose them
// as globals (Node 26 + jsdom 29 + vitest 4 don't currently globalize them).
// The polyfill is a per-test, in-memory implementation conforming to the Web
// Storage API. It does not persist between tests; tests must clear() in setup
// if they care about isolation.
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
