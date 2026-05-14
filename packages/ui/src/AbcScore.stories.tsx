import type { Meta, StoryObj } from '@storybook/react'
import AbcScore from './AbcScore'

const meta: Meta<typeof AbcScore> = {
  title: 'Components/AbcScore',
  component: AbcScore,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof AbcScore>

// C major scale — quarter notes ascending one octave
// Produced by buildAbcTune(['C','D','E','F','G','A','B'], 4)
export const ScaleAbc: Story = {
  name: 'Scale — C major',
  args: {
    abc: 'X:1\nM:none\nL:1/4\nK:C\nCDEFGABc|',
    'aria-label': 'Scale notation: C, D, E, F, G, A, B',
    staffwidth: 320,
  },
}

// C major triad — stacked noteheads (chord)
// Produced by buildChordAbc(['C','E','G'])
export const ChordAbc: Story = {
  name: 'Chord — C major triad',
  args: {
    abc: 'X:1\nM:none\nL:1/1\nK:C\n[CEG]',
    'aria-label': 'Chord notation: C major triad',
    staffwidth: 320,
  },
}

// C13 chord — 7 notes spanning more than one octave
// Produced by buildChordAbc(['C','E','G','B♭','D','F','A'])
// Upper notes (D, F, A) climb to octave 5 (lowercase in ABC)
export const MultiOctaveChordAbc: Story = {
  name: 'Chord — C13 (multi-octave)',
  args: {
    abc: 'X:1\nM:none\nL:1/1\nK:C\n[CEG_Bdfa]',
    'aria-label': 'Chord notation: C13',
    staffwidth: 320,
  },
}

// Bb Dorian scale — accidentals using _ prefix
export const BbDorianScale: Story = {
  name: 'Scale — B♭ Dorian',
  args: {
    abc: 'X:1\nM:none\nL:1/4\nK:C\n_Bc_d_efg_a_b|',
    'aria-label': 'Scale notation: Bb, C, Db, Eb, F, G, Ab',
    staffwidth: 320,
  },
}
