/**
 * GlassCard — Reusable glassmorphism card with optional glow variants.
 */
export default function GlassCard({ children, className = '', glow = null, style = {} }) {
  const glowStyle = glow === 'red'
    ? { borderColor: 'rgba(255,45,85,0.25)', boxShadow: '0 0 24px rgba(255,45,85,0.1)' }
    : glow === 'blue'
    ? { borderColor: 'rgba(13,148,251,0.25)', boxShadow: '0 0 24px rgba(13,148,251,0.1)' }
    : glow === 'green'
    ? { borderColor: 'rgba(57,255,20,0.2)', boxShadow: '0 0 24px rgba(57,255,20,0.08)' }
    : {}

  return (
    <div className={`card ${className}`} style={{ ...glowStyle, ...style }}>
      {children}
    </div>
  )
}
