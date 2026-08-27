/**
 * GenerationCounter — Animated self-play epoch counter and timeline.
 */
export default function GenerationCounter({ generation, timeline }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Big counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        background: 'rgba(168,85,247,0.06)',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 10,
      }}>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'var(--purple-acc)',
          lineHeight: 1,
          animation: 'glow-pulse 2s ease infinite',
        }}>
          G{generation}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple-acc)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Generation
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Self-play epoch — adversarial co-evolution
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {(timeline || []).map((t, i) => (
          <div key={t.generation} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              flexShrink: 0,
              background: t.generation <= generation ? 'var(--grad-brand)' : 'var(--bg-card)',
              border: `1px solid ${t.generation <= generation ? 'transparent' : 'var(--border-default)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: t.generation <= generation ? 'white' : 'var(--text-muted)',
              fontFamily: 'var(--font-head)',
              boxShadow: t.generation === generation ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.4s ease',
            }}>
              G{t.generation}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--red-team)' }}>
                  Red {(t.red_sophistication * 100).toFixed(0)}%
                </span>
                <span style={{ color: 'var(--ac-dodger)' }}>
                  Blue {(t.blue_accuracy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="threat-bar-track" style={{ height: 4 }}>
                <div
                  className="threat-bar-fill"
                  style={{
                    width: `${t.blue_accuracy * 100}%`,
                    background: `linear-gradient(90deg, var(--red-team) 0%, var(--ac-dodger) ${t.blue_accuracy * 100}%)`,
                    opacity: t.generation <= generation ? 1 : 0.3,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
