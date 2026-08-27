/**
 * AgentAvatar — Animated agent card with live state indicator.
 */
export default function AgentAvatar({
  type,         // 'red' | 'blue'
  generation,
  sessionId,
  isActive,     // currently executing
  phase,        // 'attacking' | 'defending' | 'idle'
  attacks,
  blocks,
  currentStrategy,
  blockRate,
}) {
  const isRed  = type === 'red'
  const isBlue = type === 'blue'

  return (
    <div className={`agent-card ${isRed ? 'red-agent' : 'blue-agent'} ${isActive ? (isRed ? 'attacking' : 'defending') : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className={`agent-avatar ${type}`}>
          {isRed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D94FB" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" strokeWidth="2.5"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div className={`agent-name ${type}`}>
            {isRed ? 'Red Team Agent' : 'Blue Team Agent'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {sessionId ? sessionId.slice(0, 8).toUpperCase() : (isBlue ? 'DEFENSE STACK' : 'STANDBY')}
          </div>
        </div>

        <span className={`badge ${isRed ? 'badge-red' : 'badge-blue'}`}>
          Gen {generation}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {isRed ? (
          <>
            <div className="agent-stat">
              Attacks: <strong style={{ color: 'var(--red-team)', fontFamily: 'var(--font-mono)' }}>{attacks}</strong>
            </div>
            <div className="agent-stat" style={{ fontSize: '0.7rem' }}>
              Strategy: <strong style={{ color: currentStrategy?.color || 'var(--text-muted)', fontSize: '0.68rem' }}>
                {currentStrategy?.strategy_name || 'Idle'}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div className="agent-stat">
              Blocks: <strong style={{ color: 'var(--green-safe)', fontFamily: 'var(--font-mono)' }}>{blocks}</strong>
            </div>
            <div className="agent-stat">
              Rate: <strong style={{ color: 'var(--ac-dodger)', fontFamily: 'var(--font-mono)' }}>{blockRate}%</strong>
            </div>
          </>
        )}
      </div>

      {isActive && (
        <div style={{
          fontSize: '0.7rem',
          color: isRed ? 'var(--red-team)' : 'var(--ac-dodger)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <span className="status-dot" style={{ background: isRed ? 'var(--red-team)' : 'var(--ac-dodger)' }} />
          {isRed ? 'Attack in progress...' : 'Policy synthesis active...'}
        </div>
      )}
    </div>
  )
}
