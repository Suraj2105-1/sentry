import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Home from './pages/Home'
import ArenaPage from './pages/ArenaPage'
import VaccinationPage from './pages/VaccinationPage'
import MerchantsPage from './pages/MerchantsPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <TopBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/arena" element={<ArenaPage />} />
            <Route path="/vaccination" element={<VaccinationPage />} />
            <Route path="/merchants" element={<MerchantsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
