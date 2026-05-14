import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { CURATED_CHORDS } from './data/curated'
import ChordRow from './features/chords/ChordRow'

/**
 * Phase 6 placeholder: all 27 chords rendered at /chords/C with root
 * hardcoded to 'C'. Phase 7 will add <RootPicker> to make the root dynamic.
 */
function ChordsPlaceholder() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-stone-900 dark:text-stone-100">Chords</h1>
      <ul className="flex flex-col gap-4">
        {CURATED_CHORDS.map((def) => (
          <li key={def.id}>
            <ChordRow rootNote="C" definition={def} />
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
