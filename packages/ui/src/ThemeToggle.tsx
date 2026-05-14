type Theme = 'light' | 'dark' // declared locally — NO import from music-core

type Props = {
  theme: Theme
  onToggle: () => void
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      aria-pressed={theme === 'dark'}
      className="rounded-md border border-stone-300 px-2 py-1 text-sm hover:bg-stone-200 dark:border-stone-700 dark:hover:bg-stone-800"
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀︎' : '☾'}</span>
    </button>
  )
}
