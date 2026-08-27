/**
 * NegotiationChat  Renders live LLM adversarial negotiation turns as chat bubbles.
 * Shows Red Team buyer agent vs Blue Team circuit breaker with model badge.
 */

const MODEL_BADGE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.15rem 0.5rem',
  borderRadius: 20,
  fontSize: '0.6rem',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  letterSpacing: '0.04em',
}

export default function NegotiationChat({ turns = [], modelUsed = 'template', isLive = false }) {
  const isRealLLM = modelUsed !== 'template' && modelUsed !== 'fallback'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Header badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{
          ...MODEL_BADGE_STYLE,
          background: isRealLLM ? 'rgba(13,148,251,0.15)' : 'rgba(136,136,136,0.12)',
          border: `1px solid ${isRealLLM ? 'rgba(13,148,251,0.4)' : 'rgba(136,136,136,0.25)'}`,
          color: isRealLLM ? 'var(--ac-dodger)' : 'var(--text-muted)',
        }}>
          {isRealLLM ? modelUsed : 'template mode'}
        </span>
        {isLive && (
          <span style={{
            ...MODEL_BADGE_STYLE,
            background: 'rgba(57,255,20,0.08)',
            border: '1px solid rgba(57,255,20,0.25)',
            color: 'var(--green-safe)',
            animation: 'glow-pulse 1.5s ease infinite',
          }}>
             LIVE
          </span>
        )}
      </div>

      {/* Chat bubbles */}
      {turns.map((turn, i) => {
        const isRed = turn.role === 'red'
        const isDetect = turn.role === 'blue_detect'

        return (
          <div
            key={i}
            className="fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isRed ? 'flex-start' : 'flex-end',
              gap: '0.2rem',
            }}
          >
            {/* Sender label */}
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: isRed ? 'var(--red-team)' : isDetect ? 'var(--amber-warn)' : 'var(--ac-dodger)',
              paddingLeft: isRed ? '0.25rem' : 0,
              paddingRight: isRed ? 0 : '0.25rem',
            }}>
              {isRed ? 'Adversarial Buyer' : isDetect ? 'Pattern Detector' : 'Circuit Breaker'}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '85%',
              padding: '0.6rem 0.85rem',
              borderRadius: isRed ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              background: isRed
                ? 'rgba(255,45,85,0.08)'
                : isDetect
                  ? 'rgba(245,158,11,0.08)'
                  : 'rgba(13,148,251,0.08)',
              border: `1px solid ${isRed
                ? 'rgba(255,45,85,0.2)'
                : isDetect
                  ? 'rgba(245,158,11,0.2)'
                  : 'rgba(13,148,251,0.2)'}`,
              boxShadow: isRed
                ? '0 2px 8px rgba(255,45,85,0.08)'
                : '0 2px 8px rgba(13,148,251,0.06)',
            }}>
              {turn.message}
            </div>
          </div>
        )
      })}

      {/* Empty state */}
      {turns.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          opacity: 0.6,
        }}>
          Negotiation dialogue will appear here during battle
        </div>
      )}
    </div>
  )
}
