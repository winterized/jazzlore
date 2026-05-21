// MosaicV4 — image-only orbit (design `MosaicV4`). Size encodes record
// count; initials are ALWAYS rendered (color is never the sole signal, a11y
// "Mosaic tiles always carry initials"). `photo:false` collapses the tile to
// a flat surface with lifted centered initials (graceful degradation, same
// component). Tap → scroll the matching ConnRow into view (handled by the
// parent via `onTap`); the pulse fires on scroll-LAND, not here (landmine 7).

import type { Collaborator } from '../lib/types'
import type { MusicianMinimal } from '../hooks/useMusicianData'
import { Duo3 } from './Duo3'
import { initialsOf } from './duotone'

type Props = {
  collabs: Collaborator[]
  /** First tile becomes the hero block unless sparse. Default true. */
  hero?: boolean
  sparse?: boolean
  onTap?: (id: string) => void
  /** Optional portrait map from the batch byIds fetch. When a tile's id has
   * an entry, the real portrait is rendered instead of the monogram fallback. */
  portraits?: Record<string, MusicianMinimal>
}

const TILE_CAP = 14

function sizeClass(
  i: number,
  count: number,
  max: number,
  hero: boolean,
  sparse: boolean,
): string {
  if (sparse) return count >= max ? 's2 h2' : ''
  if (hero && i === 0) return 'hero'
  const r = count / max
  if (r >= 0.85) return 's3 h2'
  if (r >= 0.6) return 's2 h2'
  if (r >= 0.4) return 's2'
  if (r >= 0.25) return 'h2'
  return ''
}

export function MosaicV4({
  collabs,
  hero = true,
  sparse = false,
  onTap,
  portraits,
}: Props) {
  const tiles = collabs.slice(0, TILE_CAP)
  const max = Math.max(1, ...tiles.map((c) => c.sharedRecordCount || 1))

  return (
    <div
      className={`mosaic${sparse ? ' mosaic-sparse' : ''}`}
      role="group"
      aria-label="Orbit — who they played with most"
    >
      {tiles.map((c, i) => {
        const count = c.sharedRecordCount || 1
        // Portrait from byIds enrichment overrides the collaborator stub's
        // `photo` flag — the stub may have been fetched before picture_url
        // was populated, while the byIds result has the current value.
        const portrait = portraits?.[c.id]
        const resolvedPhoto = portrait !== undefined ? portrait.photo : c.photo
        const noPhoto = resolvedPhoto === false
        const size = sizeClass(i, count, max, hero, sparse)
        return (
          <button
            type="button"
            key={c.id}
            className={`mtile ${size}${noPhoto ? ' no-photo' : ''}`.trim()}
            // role="link": the tile navigates the rail (scroll-into-view),
            // it is not a form control. Keyboard-activatable as a button.
            role="link"
            aria-label={`${c.name}${c.instrument ? `, ${c.instrument}` : ''}, ${count} record${count === 1 ? '' : 's'} together`}
            onClick={() => onTap?.(c.id)}
          >
            <Duo3
              name={c.name}
              initials={false}
              photo={resolvedPhoto}
              portrait={portrait?.portrait}
            />
            <span className="mtile-init" aria-hidden="true">
              {initialsOf(c.name)}
            </span>
            {count > 1 && !noPhoto && (
              <span className="mtile-num" aria-hidden="true">
                ×{count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
