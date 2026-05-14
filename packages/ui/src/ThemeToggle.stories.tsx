import type { Meta, StoryObj } from '@storybook/react'
import { useState, type ComponentProps } from 'react'
import ThemeToggle from './ThemeToggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  render: function Render(args: ComponentProps<typeof ThemeToggle>) {
    const [theme, setTheme] = useState<'light' | 'dark'>(args.theme)
    return (
      <ThemeToggle
        theme={theme}
        onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    )
  },
}
export default meta

type Story = StoryObj<typeof ThemeToggle>

export const Light: Story = { args: { theme: 'light' } }
export const Dark: Story = { args: { theme: 'dark' } }
