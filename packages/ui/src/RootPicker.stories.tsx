import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import RootPicker, { type RootOption } from './RootPicker'
import type { ComponentProps } from 'react'

const DEFAULT_ROOT_OPTIONS: readonly RootOption[] = [
  { value: 'C', label: 'C' },
  { value: 'Db', label: 'D♭', alternate: { value: 'C#', label: 'C♯' } },
  { value: 'D', label: 'D' },
  { value: 'Eb', label: 'E♭', alternate: { value: 'D#', label: 'D♯' } },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F♯', alternate: { value: 'Gb', label: 'G♭' } },
  { value: 'G', label: 'G' },
  { value: 'Ab', label: 'A♭', alternate: { value: 'G#', label: 'G♯' } },
  { value: 'A', label: 'A' },
  { value: 'Bb', label: 'B♭', alternate: { value: 'A#', label: 'A♯' } },
  { value: 'B', label: 'B' },
]

const meta: Meta<typeof RootPicker> = {
  title: 'Components/RootPicker',
  component: RootPicker,
  tags: ['autodocs'],
  render: function Render(args: ComponentProps<typeof RootPicker>) {
    const [selected, setSelected] = useState(args.selected)
    return <RootPicker {...args} selected={selected} onSelect={setSelected} />
  },
}
export default meta

type Story = StoryObj<typeof RootPicker>

export const Default: Story = {
  args: { options: DEFAULT_ROOT_OPTIONS, selected: 'C' },
}

export const FSharpSelected: Story = {
  args: { options: DEFAULT_ROOT_OPTIONS, selected: 'F#' },
}

export const BbSelected: Story = {
  args: { options: DEFAULT_ROOT_OPTIONS, selected: 'Bb' },
}
