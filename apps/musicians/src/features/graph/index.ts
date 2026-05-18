// Public surface of the desktop graph feature (Phase E).
//
// Lazy-load entry for the Phase-D page integration step:
//
//   const GraphView = React.lazy(
//     () => import('./features/graph')        // ← d3-force lands here, async
//   )
//
// `import('./features/graph')` resolves the default export to `GraphView`, so
// d3-force stays out of the initial bundle (keeps initial JS ≤ 100 KB gz).
// Types are re-exported for the consumer's props without pulling the chunk.

export { default } from './GraphView'
export { default as GraphView } from './GraphView'
export type { GraphViewProps } from './GraphView'
export type { GraphLayout, LayoutNode, LayoutEdge } from './layout'
