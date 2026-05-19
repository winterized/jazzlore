// Shell — themed artboard wrapper (the design's `Board3`). Applies the `.mu3`
// scope every component CSS rule lives under, and ensures the component CSS is
// loaded once. Theme is driven by `data-theme` on <html> (music-core
// applyTheme, frozen token layer) — Shell does not re-declare tokens.

import type { ReactNode } from 'react'
import './components.css'

export function Shell({ children }: { children: ReactNode }) {
  return <div className="mu3">{children}</div>
}
