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

// F-rooted keyboard: startPc=5 anchors the visible 2-octave window on F.
// F major scale: F G A Bb C D E (pitch classes 5, 7, 9, 10, 0, 2, 4).
export const FRootedKeyboard: Story = {
  args: {
    startPc: 5,
    rootPc: 5,
    scalePcs: [5, 7, 9, 10, 0, 2, 4],
  },
}

// Bb-rooted scenario: Bb (pc=10) is a black key and is rejected by the
// component. The caller must instead choose a white-key neighbour:
// pass startPc=9 (A) to start one step below, or startPc=11 (B) to start
// one step above. This story demonstrates startPc=9 (A-rooted) as the
// recommended anchor for a Bb-rooted chord.
export const BFlatRootedKeyboard: Story = {
  args: {
    startPc: 9, // A is the nearest white key below Bb; caller chose A-rooted window
    rootPc: 10, // Bb is highlighted as root (black key)
    scalePcs: [10, 0, 1, 3, 5, 7, 8], // Bb Dorian
  },
}

// G13 chord on a G-rooted 2-octave keyboard.
// G13 = G B D F A E  →  pitch classes: G=7, B=11, D=2, F=5, A=9, E=4
// All 6 notes fit comfortably in the 2-octave window starting on G.
export const ExtendedChordOnGRoot: Story = {
  args: {
    startPc: 7,
    rootPc: 7,
    scalePcs: [7, 11, 2, 5, 9, 4],
  },
}
