/**
 * NeonBadge — Animated badge with pulse glow for status indicators.
 */
export default function NeonBadge({ children, variant = 'blue', pulse = false, style = {} }) {
  const classMap = {
    blue: 'badge-blue',
    red: 'badge-red',
    green: 'badge-green',
    amber: 'badge-amber',
    purple: 'badge-purple',
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }

  return (
    <span
      className={`badge ${classMap[variant] || 'badge-blue'}`}
      style={{
        animation: pulse ? 'pulse-badge 2s infinite' : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
