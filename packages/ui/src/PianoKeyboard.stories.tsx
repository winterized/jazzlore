import type { Meta, StoryObj } from '@storybook/react'
import PianoKeyboard from './PianoKeyboard'

const meta: Meta<typeof PianoKeyboard> = {
  title: 'Components/PianoKeyboard',
  component: PianoKeyboard,
  tags: ['autodocs'],
  args: { startOctave: 4 },
}
export default meta

type Story = StoryObj<typeof PianoKeyboard>

// C major: C D E F G A B
export const CMajor: Story = {
  args: { rootPc: 0, scalePcs: [0, 2, 4, 5, 7, 9, 11] },
}

// C natural minor: C D Eb F G Ab Bb
export const CNaturalMinor: Story = {
  args: { rootPc: 0, scalePcs: [0, 2, 3, 5, 7, 8, 10] },
}

// C minor pentatonic: C Eb F G Bb
export const CMinorPentatonic: Story = {
  args: { rootPc: 0, scalePcs: [0, 3, 5, 7, 10] },
}

// F# Phrygian: F# G A B C# D E
export const FSharpPhrygian: Story = {
  args: { rootPc: 6, scalePcs: [6, 7, 9, 11, 1, 2, 4] },
}

export const NoRoot: Story = {
  args: { rootPc: undefined, scalePcs: [] },
}
