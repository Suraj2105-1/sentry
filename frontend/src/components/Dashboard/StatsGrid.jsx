/**
 * StatsGrid  KPI cards grid showing live platform metrics.
 */
const formatValue = (key, value) => {
  if (!value && value !== 0) return '-'
  switch (key) {
    case 'merchants_protected':   return value
    case 'attacks_neutralized':   return value.toLocaleString()
    case 'harm_prevented_inr':    return `₹${(value / 100000).toFixed(1)}L`
    case 'blue_team_accuracy':    return `${(value * 100).toFixed(1)}%`
    case 'current_generation':    return `Gen ${value}`
    case 'active_sessions':       return value
    default: return value
  }
}

const ShieldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const BlockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
const MoneyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const CrosshairIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
const ZapIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const ActivityIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

const STAT_CONFIG = [
  { key: 'merchants_protected',   label: 'Merchants Protected',    color: 'var(--ac-dodger)',  icon: <ShieldIcon /> },
  { key: 'attacks_neutralized',   label: 'Attacks Neutralized',    color: 'var(--green-safe)', icon: <BlockIcon /> },
  { key: 'harm_prevented_inr',    label: 'Harm Prevented',         color: 'var(--green-safe)', icon: <MoneyIcon /> },
  { key: 'blue_team_accuracy',    label: 'Defense Accuracy',       color: 'var(--ac-dodger)',  icon: <CrosshairIcon /> },
  { key: 'current_generation',    label: 'Self-Play Generation',   color: 'var(--purple-acc)', icon: <ZapIcon /> },
  { key: 'active_sessions',       label: 'Active Simulations',     color: 'var(--amber-warn)', icon: <ActivityIcon /> },
]

export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {STAT_CONFIG.map(cfg => (
        <div key={cfg.key} className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div className="stat-label">{cfg.label}</div>
            <span style={{ fontSize: '1.1rem', opacity: 0.7 }}>{cfg.icon}</span>
          </div>
          <div className="stat-value" style={{ color: cfg.color }}>
            {formatValue(cfg.key, stats?.[cfg.key])}
          </div>
          <div className="stat-delta positive" style={{ marginTop: '0.4rem' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            Live data
          </div>
        </div>
      ))}
    </div>
  )
}
