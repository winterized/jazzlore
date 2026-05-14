import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { read, remove, write } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('writes under the jazzlore: prefix', () => {
    write('scales:v1', { hi: 1 })
    expect(localStorage.getItem('jazzlore:scales:v1')).toBe('{"hi":1}')
  })

  it('reads back what was written', () => {
    write('scales:v1', ['a', 'b'])
    expect(read<string[]>('scales:v1')).toEqual(['a', 'b'])
  })

  it('returns null for missing key', () => {
    expect(read('does:not:exist')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem('jazzlore:bad:v1', 'not-json')
    expect(read('bad:v1')).toBeNull()
  })

  it('removes only the namespaced key', () => {
    write('a:v1', 1)
    write('b:v1', 2)
    remove('a:v1')
    expect(read('a:v1')).toBeNull()
    expect(read('b:v1')).toBe(2)
  })

  it('throws if the suffix already starts with the prefix (defensive)', () => {
    expect(() => write('jazzlore:scales:v1', 1)).toThrow()
  })
})
