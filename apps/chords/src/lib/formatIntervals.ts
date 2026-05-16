/**
 * Maps Tonal interval strings (e.g. '3M', '7m', '4A') to display tokens
 * suitable for showing chord intervals to musicians (e.g. '3', '♭7', '♯11').
 *
 * 4A maps to '♯11' rather than '♯4' because in a chord context an augmented
 * fourth always represents the lydian raised-11th tension.
 */
const TONAL_TO_DISPLAY: Record<string, string> = {
  '1P': '1',
  '2m': '♭2',
  '2M': '2',
  '2A': '♯2',
  '3m': '♭3',
  '3M': '3',
  '4P': '4',
  '4A': '♯11',
  '5d': '♭5',
  '5P': '5',
  '5A': '♯5',
  '6m': '♭6',
  '6M': '6',
  '7d': '♭♭7',
  '7m': '♭7',
  '7M': '7',
  '9m': '♭9',
  '9M': '9',
  '9A': '♯9',
  '11P': '11',
  '11A': '♯11',
  '13m': '♭13',
  '13M': '13',
}

/**
 * Convert an array of Tonal interval strings to a single space-separated
 * display string of interval tokens.
 *
 * @example
 *   formatIntervals(['1P','3M','5P','7m']) // '1 3 5 ♭7'
 *   formatIntervals(['1P','3M','7m','9m','9A','11A','13m']) // '1 3 ♭7 ♭9 ♯9 ♯11 ♭13'
 */
export function formatIntervals(tonalIntervals: readonly string[]): string {
  return tonalIntervals
    .map((interval) => {
      const token = TONAL_TO_DISPLAY[interval]
      if (token === undefined) {
        throw new Error(`Unknown tonal interval "${interval}" — add it to TONAL_TO_DISPLAY`)
      }
      return token
    })
    .join(' ')
}
