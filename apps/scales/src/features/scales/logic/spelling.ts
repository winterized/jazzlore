export const DEFAULT_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const
export type DefaultRoot = (typeof DEFAULT_ROOTS)[number]

const ALTERNATES: Record<string, string> = {
  Db: 'C#',
  'C#': 'Db',
  Eb: 'D#',
  'D#': 'Eb',
  'F#': 'Gb',
  Gb: 'F#',
  Ab: 'G#',
  'G#': 'Ab',
  Bb: 'A#',
  'A#': 'Bb',
}

export const ALL_ROOTS: readonly string[] = [
  ...DEFAULT_ROOTS,
  'C#', 'D#', 'Gb', 'G#', 'A#',
]

export function isAmbiguous(root: string): boolean {
  return root in ALTERNATES
}

export function alternateSpelling(root: string): string | null {
  return ALTERNATES[root] ?? null
}

export function normalizeRoot(value: string): string | null {
  return ALL_ROOTS.includes(value) ? value : null
}

/** Convert an internal root like 'Bb' / 'F#' to display form 'B♭' / 'F♯'. */
export function formatRoot(root: string): string {
  return root.replace('b', '♭').replace('#', '♯')
}

/** Convert a display-form root like 'B♭' / 'F♯' to the internal form 'Bb' / 'F#'. Pass-through for naturals or already-internal input. */
export function toInternal(root: string): string {
  return root.replace('♭', 'b').replace('♯', '#')
}
