// App-wide render safety net. Before this, ANY uncaught exception thrown
// during render (e.g. a BFF contract violation like the sparse-musician
// title-less record that crashed the v1.1 widget deep-link) unmounted the
// entire React tree → a blank screen after the splash. This boundary catches
// those and shows the same calm "error" screen the data layer uses, so a bad
// data shape degrades gracefully instead of catastrophically.
//
// React error boundaries must be class components (no hook equivalent for
// getDerivedStateFromError / componentDidCatch). `resetKey` lets the parent
// clear the error on navigation so a single bad page doesn't strand the whole
// session — pass the router pathname and the boundary recovers on the next route.

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WakingState } from '../features/status/WakingState'
import { CURATED } from '../test/fixtures'

// Cached, always-navigable fallback names (mirrors MusicianPage's FALLBACK):
// the reader is never stranded even when the live screen failed.
const FALLBACK = CURATED.slice(0, 5).map((c) => ({ id: c.id, name: c.name }))

type Props = {
  children: ReactNode
  /** Changing this value (e.g. the router pathname) clears a caught error so
   * navigating away from a broken page recovers the session. */
  resetKey?: unknown
}

type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Diagnostic breadcrumb (the user only sees the calm screen). Keeps the
    // component stack so a future contract violation is traceable from logs.
    console.error(
      '[ErrorBoundary] uncaught render error:',
      error,
      info.componentStack,
    )
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <WakingState
          variant="error"
          fallback={FALLBACK}
          onRetry={() => this.setState({ hasError: false })}
        />
      )
    }
    return this.props.children
  }
}
