import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': 'Overview Dashboard',
  '/arena': 'Live Arena',
  '/vaccination': 'Vaccination Scanner',
  '/merchants': 'Merchant Profiles',
}

export default function TopBar() {
  const location = useLocation()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const title = PAGE_TITLES[location.pathname] || 'Adversarial Shadow'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 style={{ fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {time.toLocaleTimeString('en-IN', { hour12: false })} IST
        </span>
        <div className="status-pill">
          <span className="status-dot"></span>
          System Operational
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--grad-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>MR</div>
      </div>
    </header>
  )
}
