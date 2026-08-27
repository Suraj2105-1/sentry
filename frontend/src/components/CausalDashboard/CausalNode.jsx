/**
 * CausalNode — Individual node tooltip component for the causal DAG.
 */
const NODE_COLORS = {
  BEHAVIOR:       { fill: 'rgba(239,68,68,0.15)',  stroke: '#EF4444', text: '#FCA5A5' },
  PATTERN:        { fill: 'rgba(249,115,22,0.15)', stroke: '#F97316', text: '#FDC396' },
  IMPACT:         { fill: 'rgba(234,179,8,0.15)',  stroke: '#EAB308', text: '#FDE047' },
  COUNTERFACTUAL: { fill: 'rgba(139,92,246,0.15)', stroke: '#8B5CF6', text: '#C4B5FD' },
  DECISION:       { fill: 'rgba(13,148,251,0.15)', stroke: '#0D94FB', text: '#7DD3FC' },
  UNCERTAINTY:    { fill: 'rgba(245,158,11,0.15)', stroke: '#F59E0B', text: '#FCD34D' },
}

export default function CausalNode({ node }) {
  const colors = NODE_COLORS[node.type] || NODE_COLORS.BEHAVIOR

  return (
    <div style={{
      background: colors.fill,
      border: `1px solid ${colors.stroke}`,
      borderRadius: 8,
      padding: '0.5rem 0.75rem',
      display: 'inline-flex',
      flexDirection: 'column',
      gap: '0.2rem',
      maxWidth: 200,
    }}>
      <div style={{
        fontSize: '0.58rem',
        fontWeight: 800,
        color: colors.stroke,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
      }}>
        {node.type}
      </div>
      <div style={{
        fontSize: '0.78rem',
        fontWeight: 600,
        color: colors.text,
        fontFamily: 'var(--font-head)',
      }}>
        {node.label}
      </div>
      {node.detail && (
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
          {node.detail}
        </div>
      )}
      <div style={{ marginTop: '0.2rem' }}>
        <div style={{
          height: 3,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(node.confidence || 0.9) * 100}%`,
            height: '100%',
            background: colors.stroke,
            borderRadius: 99,
          }} />
        </div>
      </div>
    </div>
  )
}

export { NODE_COLORS }
