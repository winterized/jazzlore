// Autosuggest — header/home search as a WAI-ARIA 1.2 combobox, mirroring the
// proven scales/chords SearchBox a11y pattern (input role=combobox +
// portalled role=listbox/option, aria-activedescendant, full keyboard,
// Esc/Tab/blur close, option onMouseDown preventDefault).
//
// Client-side over a cached corpus fetched ONCE (mock /api/musicians/
// search-index; one page = one BFF call — no per-keystroke backend). 80ms
// debounce; ≤6 results with a 60ms stagger (components.css mu3-suggest-in,
// per-option animation-delay). Highlight via the FROZEN matchRanges; the
// <em> is never remounted (Highlight uses stable keys).

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import type { SearchIndexResponse } from '../../lib/types'
import { fixtureSource } from '../../hooks/useMusicianData'
import { isWaking } from '../../lib/types'
import { SearchIcon } from '../../components/icons'
import { searchCorpus } from './searchCorpus'
import { SuggestOptions } from './SuggestOptions'

const DEBOUNCE_MS = 80

type Pos = { top: number; left: number; width: number }

export function Autosuggest({
  loadCorpus = () => fixtureSource.searchIndex(),
}: {
  loadCorpus?: () => Promise<
    SearchIndexResponse | { status: 'waking'; retryAfter: number }
  >
}) {
  const navigate = useNavigate()
  const [corpus, setCorpus] = useState<SearchIndexResponse['corpus']>([])
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState<Pos | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  // Cache the corpus once per mount (no per-keystroke fetch).
  useEffect(() => {
    let live = true
    loadCorpus()
      .then((r) => {
        if (live && !isWaking(r)) setCorpus(r.corpus)
      })
      .catch(() => {
        /* corpus stays empty → calm "no matches"; never a crash */
      })
    return () => {
      live = false
    }
  }, [loadCorpus])

  // 80ms debounce on the query.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  const hits = debounced.trim() ? searchCorpus(corpus, debounced) : []
  const showList = open && debounced.trim().length > 0
  const activeIdx = active >= 0 && active < hits.length ? active : -1
  const activeId = activeIdx >= 0 ? `${listId}-o${activeIdx}` : undefined

  // Reposition the portalled listbox under the input while open (same as the
  // proven SearchBox — the portal can't be clipped by the sticky header).
  useLayoutEffect(() => {
    if (!showList) return
    const place = (): void => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const width = Math.min(
        Math.max(r.width, 280),
        window.innerWidth - 16,
      )
      const left = Math.min(
        r.left,
        Math.max(8, window.innerWidth - width - 8),
      )
      setPos({ top: r.bottom + 6, left, width })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [showList])

  const choose = (id: string): void => {
    setOpen(false)
    inputRef.current?.blur()
    void navigate(`/musicians/${encodeURIComponent(id)}`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!showList) setOpen(true)
      if (hits.length) {
        setActive(activeIdx + 1 >= hits.length ? 0 : activeIdx + 1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (hits.length) {
        setActive(activeIdx <= 0 ? hits.length - 1 : activeIdx - 1)
      }
    } else if (e.key === 'Enter') {
      const h = hits[activeIdx]
      if (showList && h) {
        e.preventDefault()
        choose(h.entry.id)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (showList) setOpen(false)
      else if (query) setQuery('')
    }
  }

  return (
    <div className="search-wrap">
      <span className="search-icon">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        className="search-input"
        aria-label="Search a musician"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="search"
        enterKeyHint="search"
        placeholder="Search a musician…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(-1)
          setOpen(e.target.value.trim().length > 0)
        }}
        onFocus={() => query.trim().length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />

      {showList &&
        createPortal(
          <SuggestOptions
            listId={listId}
            hits={hits}
            activeIdx={activeIdx}
            pos={pos}
            onChoose={choose}
          />,
          document.body,
        )}
    </div>
  )
}
