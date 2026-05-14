import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import CollectionPage from './pages/CollectionPage'
import ScalesPage from './pages/ScalesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/scales/C" replace />} />
        <Route path="/scales/:root" element={<ScalesPage />} />
        <Route path="/collection/scales" element={<CollectionPage />} />
        <Route path="*" element={<Navigate to="/scales/C" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
