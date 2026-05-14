import type { Preview } from '@storybook/react'
import './preview.css'

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Light or dark theme (sets data-theme on <html>)',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as 'light' | 'dark'
      // Apply data-theme to the html element so the @custom-variant dark rules kick in
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme)
      }
      return Story()
    },
  ],
}

export default preview
