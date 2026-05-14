import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chords/C" replace />} />
        <Route
          path="/chords/:root"
          element={
            <div className="p-8">
              <h1 className="text-2xl font-bold">Jazzlore — Chords</h1>
              <p className="mt-2 text-gray-600">Chord reference coming soon.</p>
            </div>
          }
        />
        <Route path="/collection/chords" element={<Navigate to="/chords/C" replace />} />
        <Route path="*" element={<Navigate to="/chords/C" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
