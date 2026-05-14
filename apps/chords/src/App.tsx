import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { CURATED_CHORDS } from './data/curated'

function ChordsPlaceholder() {
  return (
    <main className="p-4">
      <h1>Chords (Phase 2 placeholder)</h1>
      <p>{CURATED_CHORDS.length} chords loaded.</p>
      <ul>
        {CURATED_CHORDS.map((c) => (
          <li key={c.id}>
            {c.primarySuffix === '' ? 'C' : `C${c.primarySuffix}`} — {c.fullName}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chords/:root" element={<ChordsPlaceholder />} />
        <Route path="/collection/chords" element={<Navigate to="/chords/C" replace />} />
        <Route path="*" element={<Navigate to="/chords/C" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
