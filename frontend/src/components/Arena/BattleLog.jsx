import { useRef, useEffect } from 'react'

/**
 * BattleLog — Scrolling terminal-style event feed with type-colored entries.
 */
export default function BattleLog({ logs, isRunning }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 220, maxHeight: 300 }}>
      <div className="card-header">
        <span className="card-title">Battle Log</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {logs.length} events
          </span>
          {isRunning && (
            <div className="status-pill">
              <span className="status-dot" />
              Live
            </div>
          )}
        </div>
      </div>

      <div className="log-stream" ref={logRef}>
        {logs.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem', opacity: 0.3 }}>⚔️</div>
            Launch the arena to begin the adversarial simulation...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-entry ${log.type}`}>
              <span className="log-timestamp">{log.time}</span>
              <span className="log-text" style={{ color: log.color }}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
