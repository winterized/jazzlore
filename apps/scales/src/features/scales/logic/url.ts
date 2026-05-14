import { ALL_ROOTS, normalizeRoot } from './spelling'

export function slugFromRoot(root: string): string {
  if (root.endsWith('b')) return `${root[0]}-flat`
  if (root.endsWith('#')) return `${root[0]}-sharp`
  return root
}

export function rootFromSlug(slug: string): string | null {
  let candidate: string
  if (/^[A-G]$/.test(slug)) candidate = slug
  else if (/^[A-G]-flat$/.test(slug)) candidate = `${slug[0]}b`
  else if (/^[A-G]-sharp$/.test(slug)) candidate = `${slug[0]}#`
  else return null

  return normalizeRoot(candidate)
}

export { ALL_ROOTS }
