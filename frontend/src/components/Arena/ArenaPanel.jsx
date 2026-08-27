/**
 * ArenaPanel — Main battle canvas orchestrating all Arena sub-components.
 * This is the fully integrated arena panel used by ArenaPage.
 */
import AgentAvatar from './AgentAvatar'
import BattleLog from './BattleLog'
import ThreatMeter from './ThreatMeter'
import CheckoutWidget from './CheckoutWidget'
import CausalGraph from '../CausalDashboard/CausalGraph'

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

export default function ArenaPanel({
  arenaState,
  logs,
  causalData,
  currentAttack,
  currentDefense,
  isRunning,
  merchants,
  selectedMerchant,
}) {
  const blockRate = arenaState.red_attacks > 0
    ? ((arenaState.blue_blocks / arenaState.red_attacks) * 100).toFixed(1)
    : '0.0'

  const merchantName = merchants.find(m => m.id === selectedMerchant)?.name

  return (
    <div className="arena-layout">
      {/* LEFT column */}
      <div className="arena-main">
        {/* Agent row */}
        <div className="arena-agents-row">
          <AgentAvatar
            type="red"
            generation={arenaState.redGen}
            sessionId={null}
            isActive={arenaState.phase === 'attacking'}
            phase={arenaState.phase}
            attacks={arenaState.red_attacks}
            currentStrategy={currentAttack}
          />
          <div className="vs-badge">VS</div>
          <AgentAvatar
            type="blue"
            generation={arenaState.blueGen}
            isActive={arenaState.phase === 'defending'}
            phase={arenaState.phase}
            blocks={arenaState.blue_blocks}
            blockRate={blockRate}
          />
        </div>

        {/* Checkout + metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CheckoutWidget merchantName={merchantName} phase={arenaState.phase} />
          <ThreatMeter
            marginHealth={arenaState.margin_health}
            harmPrevented={arenaState.harm_prevented_inr}
            generation={arenaState.generation}
            blockRate={blockRate}
          />
        </div>

        {/* Battle Log */}
        <BattleLog logs={logs} isRunning={isRunning} />
      </div>

      {/* RIGHT column: Causal graph + defense detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
        <div className="card" style={{ flex: 1, minHeight: 420 }}>
          <div className="card-header">
            <span className="card-title">Causal Attribution DAG</span>
            {currentDefense && (
              <span className={`badge ${currentDefense.blocked ? 'badge-green' : 'badge-amber'}`}>
                {currentDefense.blocked ? 'BLOCKED' : 'PASSED'}
              </span>
            )}
          </div>
          <div style={{ height: 'calc(100% - 52px)', padding: '0.75rem' }}>
            {causalData ? (
              <CausalGraph data={causalData} />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '0.75rem',
                color: 'var(--text-muted)',
                opacity: 0.6,
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: '0.78rem', textAlign: 'center', maxWidth: 180 }}>
                  Causal DAG will appear after first defense event
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          {causalData && (
            <div className="causal-legend">
              {[
                { type: 'BEHAVIOR', color: '#EF4444' },
                { type: 'PATTERN', color: '#F97316' },
                { type: 'IMPACT', color: '#EAB308' },
                { type: 'COUNTERFACTUAL', color: '#8B5CF6' },
                { type: 'DECISION', color: '#0D94FB' },
              ].map(n => (
                <div key={n.type} className="legend-item">
                  <div className="legend-dot" style={{ background: n.color }} />
                  {n.type}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Defense Policy detail */}
        {currentDefense && (
          <div className="card scale-in">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Defense Policy</span>
              <span className="badge badge-blue" style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                {currentDefense.policy_id}
              </span>
            </div>
            <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {currentDefense.policy_name}
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Confidence: <strong style={{ color: 'var(--ac-dodger)' }}>
                    {(currentDefense.confidence * 100).toFixed(1)}%
                  </strong>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Harm Prevented: <strong style={{ color: 'var(--green-safe)' }}>
                    {formatINR(currentDefense.harm_prevented_inr)}
                  </strong>
                </span>
              </div>
              {currentDefense.epistemic_escalate && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  color: 'var(--amber-warn)',
                  lineHeight: 1.5,
                }}>
                  ⚠️ {currentDefense.escalation_message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current attack details */}
        {currentAttack && (
          <div className="card scale-in">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Attack Vector</span>
              <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>
                {currentAttack.severity}
              </span>
            </div>
            <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: currentAttack.color, marginBottom: '0.3rem' }}>
                {currentAttack.strategy_name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {currentAttack.description}
              </p>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}>
                Impact: <strong style={{ color: 'var(--red-team)' }}>
                  {formatINR(currentAttack.impact_inr)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
