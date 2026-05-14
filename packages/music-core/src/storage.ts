const PREFIX = 'jazzlore:'

function fullKey(suffix: string): string {
  if (suffix.startsWith(PREFIX)) {
    throw new Error(`storage key suffix must not include the "${PREFIX}" prefix (got "${suffix}")`)
  }
  return `${PREFIX}${suffix}`
}

export function write<T>(suffix: string, value: T): void {
  localStorage.setItem(fullKey(suffix), JSON.stringify(value))
}

export function read<T>(suffix: string): T | null {
  const raw = localStorage.getItem(fullKey(suffix))
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function remove(suffix: string): void {
  localStorage.removeItem(fullKey(suffix))
}
