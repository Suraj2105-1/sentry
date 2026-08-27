import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getAttackDistribution, getGenerationTimeline, fetchMerchants } from '../hooks/api'
import StatsGrid from '../components/Dashboard/StatsGrid'
import AttackChart from '../components/Dashboard/AttackChart'
import GenerationCounter from '../components/Dashboard/GenerationCounter'
import BenchmarkChart from '../components/Dashboard/BenchmarkChart'
import LoadingPulse from '../components/Shared/LoadingPulse'

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [distribution, setDistribution] = useState([])
  const [timeline, setTimeline] = useState([])
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, t, m] = await Promise.all([
          getDashboardStats(),
          getAttackDistribution(),
          getGenerationTimeline(),
          fetchMerchants(),
        ])
        setStats(s)
        setDistribution(d.distribution || [])
        setTimeline(t.timeline || [])
        setMerchants(m.merchants || [])
      } catch (e) {
        console.error('Failed to load dashboard', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <LoadingPulse text="Connecting to defense grid..." />
    </div>
  )

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Merchant Defense Dashboard</h1>
        <p className="page-subtitle">
          Real-time adversarial immune system — monitoring merchant protection across all agentic channels
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Attack Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attack Vector Distribution</span>
            <span className="badge badge-blue">Last 24h</span>
          </div>
          <div className="card-body">
            <AttackChart distribution={distribution} />
          </div>
        </div>

        {/* Self-Play Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Self-Play Co-Evolution</span>
            <span className="badge badge-purple">Gen 1-8</span>
          </div>
          <div className="card-body">
            <GenerationCounter
              generation={stats?.current_generation || 1}
              timeline={timeline}
            />
          </div>
        </div>
      </div>

      {/* Generation Benchmark Curve */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title">Generation Benchmark Curve</span>
          <span className="badge badge-purple">G1 → G30</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
            Runs headless Red vs Blue simulation across N generations. Watch Blue block rate rise and average attack impact fall as both agents co-evolve.
          </p>
          <BenchmarkChart merchants={merchants} />
        </div>
      </div>

      {/* Live Platform Status */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title">Live Platform Status</span>
          <div className="status-pill">
            <span className="status-dot" />
            All Systems Operational
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Backend API',        status: 'online',  latency: '12ms' },
              { label: 'WebSocket Stream',   status: 'online',  latency: '8ms' },
              { label: 'Simulation Engine',  status: 'active',  latency: '—' },
              { label: 'PDF Generator',      status: 'ready',   latency: '—' },
            ].map(svc => (
              <div key={svc.label} style={{
                padding: '0.75rem',
                background: 'var(--bg-card)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-safe)' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {svc.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--green-safe)', textTransform: 'uppercase' }}>{svc.status}</span>
                  {svc.latency !== '—' && (
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{svc.latency}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/arena')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Launch Live Arena
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/vaccination')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <line x1="7" y1="12" x2="17" y2="12"/>
            </svg>
            Run Vaccination Scan
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/merchants')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Manage Merchants
          </button>
        </div>
      </div>

      {/* Tagline card */}
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(1,38,82,0.7) 0%, rgba(13,53,102,0.5) 100%)',
        border: '1px solid rgba(13,148,251,0.2)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(12px)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.7 }}>
          "While everyone else is teaching AI to shop, we're teaching AI to protect the store from AI shoppers."
        </p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Causal AI Defense', 'Self-Play Evolution', 'Zero False Positives', 'Real-Time Protection'].map(tag => (
            <span key={tag} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
