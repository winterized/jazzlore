// Asset-import declaration for `@jazzlore/ui` source. Apps that consume this
// package get `*.svg` typings from `vite/client`; this package is also type-
// checked standalone (tsc), so it needs its own ambient module declaration.
// Each app's Vite/Vitest pipeline resolves the import to the emitted asset URL.
declare module '*.svg' {
  const src: string
  export default src
}
