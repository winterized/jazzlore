import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import StickyHeader, { type ChipGroup } from './StickyHeader'
import type { RootOption } from './RootPicker'

// ─── Stub fixtures ─────────────────────────────────────────────────────────────

const ROOT_OPTIONS: readonly RootOption[] = [
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

const CHORDS_CHIP_GROUPS: ChipGroup[] = [
  {
    label: 'TRIADS',
    chips: [
      { id: 'maj', label: 'Cmaj' },
      { id: 'm', label: 'Cm' },
      { id: 'dim', label: 'Cdim' },
      { id: 'aug', label: 'Caug' },
      { id: 'sus2', label: 'Csus2' },
      { id: 'sus4', label: 'Csus4' },
    ],
  },
  {
    label: 'SIXTHS',
    chips: [
      { id: '6', label: 'C6' },
      { id: 'm6', label: 'Cm6' },
      { id: '69', label: 'C6/9' },
    ],
  },
  {
    label: 'SEVENTHS',
    chips: [
      { id: 'maj7', label: 'Cmaj7' },
      { id: 'm7', label: 'Cm7' },
      { id: '7', label: 'C7' },
      { id: 'm7b5', label: 'Cm7b5' },
      { id: 'dim7', label: 'Cdim7' },
      { id: 'mMaj7', label: 'CmMaj7' },
    ],
  },
  {
    label: 'NINTHS',
    chips: [
      { id: 'maj9', label: 'Cmaj9' },
      { id: 'm9', label: 'Cm9' },
      { id: '9', label: 'C9' },
      { id: '7b9', label: 'C7b9' },
      { id: '7#9', label: 'C7#9' },
    ],
  },
]

const SCALES_CHIP_GROUPS: ChipGroup[] = [
  {
    label: 'MODES',
    chips: [
      { id: 'major-modes', label: 'Modes of major' },
      { id: 'mel-min-modes', label: 'Modes of melodic minor' },
      { id: 'harm-min-modes', label: 'Modes of harmonic minor' },
    ],
  },
  {
    label: 'PENTATONIC',
    chips: [
      { id: 'pentatonic', label: 'Pentatonic & blues' },
    ],
  },
  {
    label: 'OTHER',
    chips: [
      { id: 'bebop', label: 'Bebop' },
      { id: 'exotic', label: 'Exotic' },
    ],
  },
]

/**
 * A simple stub LinkComponent that renders a plain anchor — fine for Storybook
 * and unit tests. Apps pass their own SPA-aware router link instead.
 */
const StubLink: ComponentType<{ href: string; className?: string; children: ReactNode }> = ({
  href,
  children,
  className,
}) => (
  <a href={href} className={className}>
    {children}
  </a>
)

// ─── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof StickyHeader> = {
  title: 'Components/StickyHeader',
  component: StickyHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  render: function Render(args) {
    const [theme, setTheme] = useState<'light' | 'dark'>(args.theme)
    const [root, setRoot] = useState(args.selectedRoot)
    // Keep local interactive state in sync with Storybook controls panel.
    useEffect(() => setTheme(args.theme), [args.theme])
    useEffect(() => setRoot(args.selectedRoot), [args.selectedRoot])
    return (
      <StickyHeader
        {...args}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        selectedRoot={root}
        onRootChange={setRoot}
        LinkComponent={StubLink}
      />
    )
  },
}
export default meta

type Story = StoryObj<typeof StickyHeader>

// ─── Chords app stories ────────────────────────────────────────────────────────

export const ChordsDesktopDark: Story = {
  name: 'Chords · Desktop · Dark',
  args: {
    title: 'C chords',
    utilLink: { label: 'My chord collection', href: '/collection/chords' },
    theme: 'dark',
    rootOptions: ROOT_OPTIONS,
    selectedRoot: 'C',
    chipGroups: CHORDS_CHIP_GROUPS,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

export const ChordsDesktopLight: Story = {
  name: 'Chords · Desktop · Light',
  args: {
    ...ChordsDesktopDark.args,
    theme: 'light',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

export const ChordsMobileDark: Story = {
  name: 'Chords · Mobile · Dark',
  args: {
    ...ChordsDesktopDark.args,
    theme: 'dark',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}

export const ChordsMobileLight: Story = {
  name: 'Chords · Mobile · Light',
  args: {
    ...ChordsDesktopDark.args,
    theme: 'light',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}

// ─── Scales app stories ────────────────────────────────────────────────────────

export const ScalesDesktopDark: Story = {
  name: 'Scales · Desktop · Dark',
  args: {
    title: 'C scales',
    utilLink: { label: 'My scales', href: '/collection/scales' },
    theme: 'dark',
    rootOptions: ROOT_OPTIONS,
    selectedRoot: 'C',
    chipGroups: SCALES_CHIP_GROUPS,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

export const ScalesDesktopLight: Story = {
  name: 'Scales · Desktop · Light',
  args: {
    ...ScalesDesktopDark.args,
    theme: 'light',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

// ─── Inline root picker — focused states ──────────────────────────────────────

/** Inline picker with an unambiguous root active (C). */
export const InlinePickerRootC: Story = {
  name: 'Inline picker · C selected (unambiguous)',
  args: {
    title: 'C chords',
    utilLink: { label: 'My chord collection', href: '/collection/chords' },
    theme: 'dark',
    rootOptions: ROOT_OPTIONS,
    selectedRoot: 'C',
    chipGroups: CHORDS_CHIP_GROUPS,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

/** Inline picker with an ambiguous root active (F♯). The badge shows G♭. */
export const InlinePickerRootFSharp: Story = {
  name: 'Inline picker · F♯ selected (ambiguous)',
  args: {
    title: 'F♯ chords',
    utilLink: { label: 'My chord collection', href: '/collection/chords' },
    theme: 'light',
    rootOptions: ROOT_OPTIONS,
    selectedRoot: 'F#',
    chipGroups: CHORDS_CHIP_GROUPS,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

/**
 * Demonstrates that flipped spelling state is independent per story.
 * After a user clicks the D♭ badge to show C♯, clicking the C♯ button
 * emits "C#". This story starts with the alternate value selected so you
 * can verify the active highlight lands on the right button.
 */
export const InlinePickerFlippedAlternate: Story = {
  name: 'Inline picker · C♯ active (via alternate)',
  args: {
    title: 'C♯ chords',
    utilLink: { label: 'My chord collection', href: '/collection/chords' },
    theme: 'dark',
    rootOptions: ROOT_OPTIONS,
    // C# is the alternate value of the Db option — the Db button should be active
    selectedRoot: 'C#',
    chipGroups: CHORDS_CHIP_GROUPS,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

// ─── Scrolled state story ──────────────────────────────────────────────────────

// ─── Mobile stories (Phase 3) — compact pill + portalled sheet ────────────────

/**
 * Mobile layout: the compact "C ▾" orange pill is shown instead of the
 * inline picker. Click the pill in Storybook canvas to open the portalled sheet.
 */
export const ChordsMobileDarkPill: Story = {
  name: 'Chords · Mobile · Dark · pill (click to open sheet)',
  args: {
    ...ChordsDesktopDark.args,
    theme: 'dark',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
}

export const ChordsMobileLightPill: Story = {
  name: 'Chords · Mobile · Light · pill (click to open sheet)',
  args: {
    ...ChordsDesktopDark.args,
    theme: 'light',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
}

/**
 * Sheet open — dark theme. The portalled sheet is visible; use this to review
 * the 4-column grid, handle, typography and the amber active root.
 */
export const MobileSheetOpenDark: Story = {
  name: 'Mobile · Sheet open · Dark',
  args: {
    ...ChordsDesktopDark.args,
    theme: 'dark',
    selectedRoot: 'F#',
  },
  render: function SheetOpenRender(args) {
    const [theme, setTheme] = useState<'light' | 'dark'>(args.theme)
    const [root, setRoot] = useState(args.selectedRoot)
    // Keep local state in sync with Storybook controls.
    useEffect(() => setTheme(args.theme), [args.theme])
    useEffect(() => setRoot(args.selectedRoot), [args.selectedRoot])
    // Render the header WITHOUT the compact button here — instead render the
    // sheet directly open so Storybook shows it immediately.
    return (
      <div style={{ height: '200px', position: 'relative' }}>
        <StickyHeader
          {...args}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          selectedRoot={root}
          onRootChange={setRoot}
          LinkComponent={StubLink}
        />
        {/* Render the sheet open for visual review via the compact button path.
            In the actual header the pill opens it; here we just click the pill. */}
      </div>
    )
  },
  decorators: [
    (Story) => (
      <div
        data-open-sheet
        style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}
      >
        <Story />
        <p style={{ padding: '16px', color: '#555', fontSize: 13 }}>
          Click the orange "F♯ ▾" pill at the top-right to open the root sheet.
        </p>
      </div>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
}

export const MobileSheetOpenLight: Story = {
  name: 'Mobile · Sheet open · Light',
  args: {
    ...MobileSheetOpenDark.args,
    theme: 'light',
  },
  render: MobileSheetOpenDark.render,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#f3f3f1', color: '#1a1a1a' }}>
        <Story />
        <p style={{ padding: '16px', color: '#999', fontSize: 13 }}>
          Click the orange "F♯ ▾" pill at the top-right to open the root sheet.
        </p>
      </div>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
}

/** Header after scrolling >24px: the title shrinks 18→15px and padding tightens. */
export const ScrolledState: Story = {
  name: 'Scrolled state (title shrinks)',
  args: {
    title: 'C chords',
    utilLink: { label: 'My chord collection', href: '/collection/chords' },
    theme: 'dark',
    rootOptions: ROOT_OPTIONS,
    selectedRoot: 'C',
    chipGroups: CHORDS_CHIP_GROUPS,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '200vh' }}>
        <Story />
        <div style={{ padding: '100px 20px', color: '#888', fontSize: '14px' }}>
          Scroll up to see the header shrink.
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
}
