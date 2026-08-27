/**
 * LoadingPulse — Full-page and inline loading indicators.
 */
export function LoadingPulse({ size = 32, text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '3rem',
    }}>
      <div
        className="spinner"
        style={{ width: size, height: size }}
      />
      {text && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--ac-dodger)',
            display: 'inline-block',
            animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

export default LoadingPulse
