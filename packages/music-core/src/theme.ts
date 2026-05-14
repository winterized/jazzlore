import { read, remove, write } from './storage'

export type Theme = 'light' | 'dark'

const KEY = 'theme:v1'

export function getOverride(): Theme | null {
  const v = read<Theme>(KEY)
  return v === 'light' || v === 'dark' ? v : null
}

export function setOverride(theme: Theme): void {
  write(KEY, theme)
}

export function clearOverride(): void {
  remove(KEY)
}

export function systemPreference(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveInitialTheme(): Theme {
  return getOverride() ?? systemPreference()
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}
