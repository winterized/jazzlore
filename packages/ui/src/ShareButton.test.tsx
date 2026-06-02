// ShareButton — native-shell only; invisible in the browser, fires the native
// share plugin with the page data when tapped inside the Capacitor shell.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from './ShareButton'

function setNative(share?: (o: unknown) => Promise<unknown>): void {
  Object.defineProperty(window, 'Capacitor', {
    value: {
      isNativePlatform: () => true,
      Plugins: share ? { Share: { share } } : {},
    },
    configurable: true,
  })
}

afterEach(() => {
  if (Object.prototype.hasOwnProperty.call(window, 'Capacitor')) {
    Reflect.deleteProperty(window, 'Capacitor')
  }
})

describe('ShareButton', () => {
  it('renders nothing in the browser (no Capacitor native shell)', () => {
    const { container } = render(<ShareButton title="Miles Davis" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a labelled button inside the native shell', () => {
    setNative(vi.fn().mockResolvedValue(undefined))
    render(<ShareButton title="Miles Davis" label="Share Miles Davis" />)
    expect(
      screen.getByRole('button', { name: 'Share Miles Davis' }),
    ).toBeInTheDocument()
  })

  it('calls the native share plugin with title/text/url on tap', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNative(share)
    render(
      <ShareButton
        title="Miles Davis"
        text="American trumpeter"
        url="https://musicians.jazzlore.com/musicians/wikidata:Q93341"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledWith({
      title: 'Miles Davis',
      text: 'American trumpeter',
      url: 'https://musicians.jazzlore.com/musicians/wikidata:Q93341',
    })
  })

  it('does not throw when the user cancels the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new Error('cancelled'))
    setNative(share)
    render(<ShareButton title="Miles Davis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalledTimes(1)
  })
})
