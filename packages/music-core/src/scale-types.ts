export type Family =
  | 'modes-of-major'
  | 'modes-of-melodic-minor'
  | 'modes-of-harmonic-minor'
  | 'symmetric'
  | 'pentatonic-blues'
  | 'bebop'
  | 'exotic'

export type ScaleDefinition = {
  /** stable id used in URLs, storage, and aria labels */
  id: string
  /** display name */
  name: string
  /** optional smaller subtitle */
  alias?: string
  family: Family
  /** display tokens, e.g. ['1','2','♭3','4','5','6','♭7'] */
  intervalDisplay: string[]
  /** semitone offsets from root, e.g. [0,2,3,5,7,9,10] */
  semitones: number[]
}
