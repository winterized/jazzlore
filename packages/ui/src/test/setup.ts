// Type augmentation: extends vitest's Assertion with jest-dom matchers
import type {} from '@testing-library/jest-dom/vitest'
// Runtime registration: must import from local vitest to avoid dual-instance
// issue in pnpm workspaces where the pnpm-store's jest-dom resolves a different
// vitest than the one running the worker.
import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)
