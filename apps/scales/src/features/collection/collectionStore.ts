import { read, write } from '@jazzlore/music-core'

const KEY = 'scales:v1'

export type SavedScale = {
  rootNote: string
  scaleId: string
  savedAt: string
}

export function listSaved(): SavedScale[] {
  return read<SavedScale[]>(KEY) ?? []
}

export function isSaved(rootNote: string, scaleId: string): boolean {
  return listSaved().some((s) => s.rootNote === rootNote && s.scaleId === scaleId)
}

export function save(entry: Omit<SavedScale, 'savedAt'>): void {
  const list = listSaved()
  if (list.some((s) => s.rootNote === entry.rootNote && s.scaleId === entry.scaleId)) return
  list.push({ ...entry, savedAt: new Date().toISOString() })
  write(KEY, list)
}

export function unsave(rootNote: string, scaleId: string): void {
  const next = listSaved().filter((s) => !(s.rootNote === rootNote && s.scaleId === scaleId))
  write(KEY, next)
}
