/**
 * Type definitions for chord identities, definitions, and resolved voicings.
 *
 * All display strings use Unicode accidentals: ♭ (U+266D), ♯ (U+266F).
 * Double flats are written as ♭♭ (two flat signs), not 𝄫 (U+1D12B).
 */

/** Stable ASCII-safe identifier for each of the 27 curated chord shapes. */
export type ChordId =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | '6_9'
  | 'maj7'
  | 'm7'
  | '7'
  | 'm7b5'
  | 'dim7'
  | 'mmaj7'
  | 'maj9'
  | 'm9'
  | '9'
  | '7b9'
  | '7s9'
  | 'm11'
  | 'maj7s11'
  | '7s11'
  | 'maj13'
  | '13'
  | '7b13'
  | '7alt'

/**
 * A complete description of a chord shape — identity, display suffixes,
 * human name, and the two interval representations needed by consumers.
 *
 * `intervals` — semitone offsets from root (informational; used by UI for
 * piano key highlighting and other pitch-class consumers).
 *
 * `tonalIntervals` — Tonal-compatible interval strings (e.g. '3M', '5d')
 * used by `chordNotes` to produce correctly-spelled note names. Stored here
 * so each chord owns its own enharmonic spelling intent (e.g. the tritone
 * in 7alt is '4A' = F♯, while in m7♭5 it is '5d' = G♭).
 */
export type ChordDefinition = {
  /** Stable ASCII id — matches ChordId. */
  readonly id: ChordId
  /** Primary chord suffix, e.g. "m7", "dim7", "". Uses Unicode accidentals. */
  readonly primarySuffix: string
  /** Optional alternate suffix, e.g. "Δ7", "ø7". Undefined when not applicable. */
  readonly alternateSuffix?: string
  /** Human-readable full name, e.g. "minor 7th". */
  readonly fullName: string
  /** Semitone offsets from root (0-indexed). Example: maj7 → [0, 4, 7, 11]. */
  readonly intervals: readonly number[]
  /**
   * Tonal-js interval strings that drive note spelling in `chordNotes`.
   * Each entry corresponds to the same position in `intervals`.
   */
  readonly tonalIntervals: readonly string[]
}

/**
 * The resolved output of `chordNotes`: the root note plus the ordered list
 * of spelled note names for one occurrence of a chord.
 *
 * `root` — the root note in display form (Unicode accidentals), e.g. "F♯".
 * `notes` — all chord tones in stack order (root first), e.g. ["F♯","A","C♯","E"].
 */
export type ChordVoicing = {
  readonly root: string
  readonly notes: readonly string[]
}
