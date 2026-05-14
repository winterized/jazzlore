import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import ChordsPage from './pages/ChordsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chords/C" replace />} />
        <Route path="/chords/:root" element={<ChordsPage />} />
        <Route path="/collection/chords" element={<Navigate to="/chords/C" replace />} />
        <Route path="*" element={<Navigate to="/chords/C" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
