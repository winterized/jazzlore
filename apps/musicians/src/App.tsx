import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import MusicianPage from './pages/MusicianPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/musicians" replace />} />
        <Route path="/musicians" element={<HomePage />} />
        <Route path="/musicians/:id" element={<MusicianPage />} />
        <Route path="*" element={<Navigate to="/musicians" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
