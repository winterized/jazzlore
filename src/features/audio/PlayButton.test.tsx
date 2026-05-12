import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const { playScale, stopAll, unlockAudio } = vi.hoisted(() => ({
  playScale: vi.fn().mockResolvedValue(undefined),
  stopAll: vi.fn(),
  unlockAudio: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./audioEngine', () => ({
  playScale,
  stopAll,
  unlockAudio,
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
})
