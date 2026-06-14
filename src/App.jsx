import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AppProvider, useAppContext } from './context/AppContext'
import Shop from './pages/Shop'
import Orders from './pages/Orders'
import Returns from './pages/Returns'
import './App.css'

function Navbar() {
  const { adminView, setAdminView } = useAppContext()

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">🔄 Amazon Re-Loop</div>
        <nav className="navbar-links">
          <NavLink to="/shop" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Shop</NavLink>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Orders</NavLink>
          <NavLink to="/returns" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Returns</NavLink>
        </nav>
        <div className="admin-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={adminView}
              onChange={(e) => setAdminView(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-text">Admin View</span>
        </div>
      </div>
    </header>
  )
}

function AppLayout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/returns" element={<Returns />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>Powered by Groq (Llama 4 Scout) • Deterministic NRV Engine • Cryptographic Passport • React + Vite</p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  )
}
