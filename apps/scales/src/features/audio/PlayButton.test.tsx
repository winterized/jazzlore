import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const { playScale, primeAudio, stopAll, unlockAudio, audioDebugSummary } = vi.hoisted(() => ({
  playScale: vi.fn().mockResolvedValue(undefined),
  primeAudio: vi.fn(),
  stopAll: vi.fn(),
  unlockAudio: vi.fn().mockResolvedValue(undefined),
  audioDebugSummary: vi.fn(() => ''),
}))

vi.mock('@jazzlore/music-core', () => ({
  playScale,
  primeAudio,
  stopAll,
  unlockAudio,
  audioDebugSummary,
  // ensureEngine is called internally by playScale, not by the component.
  // Stub it so the module shape is complete.
  ensureEngine: vi.fn().mockResolvedValue('sampler'),
}))

import PlayButton from './PlayButton'

describe('PlayButton', () => {
  it('calls unlockAudio + playScale with the given notes when clicked', async () => {
    render(<PlayButton notes={['C4', 'D4', 'E4']} ariaLabel="Play Ionian" />)
    await userEvent.click(screen.getByRole('button', { name: 'Play Ionian' }))
    expect(unlockAudio).toHaveBeenCalled()
    expect(playScale).toHaveBeenCalledWith(['C4', 'D4', 'E4'])
  })

  it('calls primeAudio before unlockAudio (iOS gesture unlock must run first)', async () => {
    primeAudio.mockClear()
    unlockAudio.mockClear()
    render(<PlayButton notes={['C4']} ariaLabel="Play Ionian" />)
    await userEvent.click(screen.getByRole('button', { name: 'Play Ionian' }))
    expect(primeAudio).toHaveBeenCalledOnce()
    const primeOrder = primeAudio.mock.invocationCallOrder[0] ?? 0
    const unlockOrder = unlockAudio.mock.invocationCallOrder[0] ?? 0
    expect(primeOrder).toBeLessThan(unlockOrder)
  })

  it('shows a play affordance (▶), not a music note (♪), when idle', () => {
    render(<PlayButton notes={['C4', 'D4', 'E4']} ariaLabel="Play Ionian" />)
    const btn = screen.getByRole('button', { name: 'Play Ionian' })
    expect(btn).toHaveTextContent('▶')
    expect(btn).not.toHaveTextContent('♪')
  })
})
