/**
 * ScanProgress  Real-time scan step feed with animated progress bar.
 */
export default function ScanProgress({ steps, scanning }) {
  const latestPct = steps.length > 0 ? (steps[steps.length - 1].percent || 0) : 0

  return (
    <div>
      {scanning && (
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Probing attack surfaces...
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ac-dodger)',
            }}>
              {latestPct}%
            </span>
          </div>
          <div className="threat-bar-track">
            <div
              className="threat-bar-fill"
              style={{
                width: `${latestPct}%`,
                background: 'var(--ac-dodger)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ padding: '0.75rem', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {steps.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            Run a scan to probe your merchant's defenses against all 7 Red Team attack vectors
          </div>
        ) : (
          steps.map((step, i) => (
            <div
              key={i}
              className={`scan-step ${step.status === 'confirmed' ? 'confirmed' : step.status === 'safe' ? 'safe' : ''}`}
              style={{ animation: 'fade-in 0.3s ease' }}
            >
              <div className="scan-step-icon" style={{
                background: step.status === 'confirmed'
                  ? 'rgba(239,68,68,0.2)'
                  : step.status === 'safe'
                  ? 'rgba(34,197,94,0.2)'
                  : step.status === 'error'
                  ? 'rgba(239,68,68,0.2)'
                  : 'rgba(13,148,251,0.2)',
                color: step.status === 'confirmed'
                  ? '#EF4444'
                  : step.status === 'safe'
                  ? '#22C55E'
                  : step.status === 'error'
                  ? '#EF4444'
                  : '#0D94FB',
              }}>
                {step.status === 'confirmed' ? '!' : step.status === 'safe' ? '✓' : step.status === 'error' ? 'X' : '~'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{step.text}</div>
                {step.severity && (
                  <span
                    className={`badge badge-${step.severity?.toLowerCase()}`}
                    style={{ marginTop: '0.2rem', fontSize: '0.58rem' }}
                  >
                    {step.severity}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
