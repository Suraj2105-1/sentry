/**
 * UncertaintyGate — Visual indicator for epistemic uncertainty escalations.
 */
export default function UncertaintyGate({ confidence, message, strategy }) {
  const uncertainty = 1 - confidence
  const isHigh = uncertainty > 0.4

  return (
    <div style={{
      background: isHigh ? 'rgba(245,158,11,0.08)' : 'rgba(13,148,251,0.06)',
      border: `1px solid ${isHigh ? 'rgba(245,158,11,0.25)' : 'rgba(13,148,251,0.2)'}`,
      borderRadius: 10,
      padding: '0.75rem 1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)'}
          strokeWidth="2">
          {isHigh ? (
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </>
          )}
        </svg>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {isHigh ? 'Epistemic Escalation' : 'Low Uncertainty'}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)',
        }}>
          OOD: {(uncertainty * 100).toFixed(1)}%
        </span>
      </div>

      {/* Uncertainty bar */}
      <div className="threat-bar-track" style={{ height: 4, marginBottom: '0.5rem' }}>
        <div
          className="threat-bar-fill"
          style={{
            width: `${uncertainty * 100}%`,
            background: isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)',
          }}
        />
      </div>

      {message && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>
      )}

      {strategy && (
        <div style={{ marginTop: '0.35rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Trigger: {strategy}
        </div>
      )}
    </div>
  )
}
