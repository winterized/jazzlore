// HomeSearchInput — the D2 default search slot: a visible, accessible,
// ≥16px search input that routes to the search route on submit. D6 replaces
// this slot with the full WAI-ARIA autosuggest combobox; until then it is a
// real, usable search field (never a fake "Search…" pill like the static
// design mock).

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { SearchIcon } from '../../components/icons'

export function HomeSearchInput() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const onSubmit = (e: FormEvent): void => {
    e.preventDefault()
    const term = q.trim()
    if (term) navigate(`/musicians?q=${encodeURIComponent(term)}`)
  }
  return (
    <form className="search-wrap" role="search" onSubmit={onSubmit}>
      <span className="search-icon">
        <SearchIcon />
      </span>
      <input
        type="search"
        className="search-input"
        aria-label="Search a musician"
        placeholder="Search a musician…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="search"
        enterKeyHint="search"
      />
    </form>
  )
}
