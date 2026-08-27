/**
 * ThreatMeter — Animated margin health bar with color-coded urgency zones.
 */
export default function ThreatMeter({ marginHealth, harmPrevented, generation, blockRate }) {
  const color = marginHealth > 70
    ? 'var(--green-safe)'
    : marginHealth > 40
    ? 'var(--amber-warn)'
    : 'var(--red-team)'

  const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Margin health bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Merchant Margin Health
          </span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color,
            fontFamily: 'var(--font-head)',
            transition: 'color 0.5s',
          }}>
            {marginHealth.toFixed(1)}%
          </span>
        </div>
        <div className="threat-bar-track" style={{ height: 10 }}>
          <div
            className="threat-bar-fill"
            style={{
              width: `${marginHealth}%`,
              background: color,
              boxShadow: `0 0 10px ${color}60`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--red-team)', opacity: 0.6 }}>CRITICAL</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--amber-warn)', opacity: 0.6 }}>WARNING</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--green-safe)', opacity: 0.6 }}>SAFE</span>
        </div>
      </div>

      {/* Revenue Protected */}
      <div className="card" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(22, 163, 74, 0.3)', background: 'linear-gradient(180deg, rgba(22, 163, 74, 0.05) 0%, rgba(15, 26, 46, 0) 100%)' }}>
        <div className="stat-label" style={{ color: 'var(--green-safe)', fontWeight: 'bold' }}>Revenue Protected</div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--green-safe)',
          lineHeight: 1.1,
          marginTop: '0.25rem',
          textShadow: '0 0 15px rgba(22,163,74,0.4)',
        }}>
          {formatINR(harmPrevented)}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Total value protected by Blue Team
        </div>
      </div>

      {/* Generation & Block Rate */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="stat-label">Generation</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: '2.2rem',
              fontWeight: 900,
              color: 'var(--ac-dodger)',
              lineHeight: 1,
            }}>{generation}</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="stat-label">Block Rate</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: '2.2rem',
              fontWeight: 900,
              color: 'var(--green-safe)',
              lineHeight: 1,
            }}>{blockRate}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
