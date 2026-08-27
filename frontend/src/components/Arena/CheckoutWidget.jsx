/**
 * CheckoutWidget — Mock Agentic Checkout with attack/defend overlay.
 */
export default function CheckoutWidget({ merchantName, phase }) {
  const isAttacking = phase === 'attacking'
  const isDefending = phase === 'defending'

  // Generate a consistent but distinct price for each merchant
  const seed = (merchantName || 'Kirana.ai Electronics').length
  const price = (seed * 899 + 1500).toLocaleString('en-IN')

  return (
    <div className="card" style={{ padding: '0.75rem' }}>
      <div className="card-title" style={{ padding: '0.5rem 0.5rem 0.75rem', fontSize: '0.78rem' }}>
        Agentic Checkout (Protected Target)
      </div>

      <div className="checkout-widget">
        {/* Agentic Checkout Header */}
        <div className="checkout-header">
          <div className="checkout-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1"/>
              <path d="M12 8l-4 8h8l-4-8z" fill="currentColor" stroke="none" fillOpacity="0.8"/>
            </svg>
            Agentic Checkout
          </div>
          <div style={{
            display: 'flex',
            gap: '4px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840' }} />
          </div>
        </div>

        {/* Checkout Body */}
        <div className="checkout-body">
          <div className="checkout-amount">
            <div className="amount-label">Order Total</div>
            <div className="amount-value">₹{price}</div>
          </div>

          <div style={{
            fontSize: '0.72rem',
            color: '#64748B',
            textAlign: 'center',
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-sans)',
          }}>
            {merchantName || 'Kirana.ai Electronics'}
          </div>

          {/* Card inputs (visual) */}
          <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              color: '#94A3B8',
            }}>
              •••• •••• •••• 4242
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <div style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: '#94A3B8',
              }}>MM/YY</div>
              <div style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: '#94A3B8',
              }}>CVV</div>
            </div>
          </div>

          <button className="checkout-pay-btn">
            Pay ₹{price} Securely
          </button>

          <div style={{
            marginTop: '0.5rem',
            textAlign: 'center',
            fontSize: '0.62rem',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            PCI DSS Compliant · 256-bit SSL
          </div>
        </div>

        {/* Attack/Defend Overlay */}
        <div className={`checkout-attack-overlay ${isAttacking || isDefending ? 'active' : ''}`}>
          {isAttacking && (
            <div style={{
              background: 'rgba(239,68,68,0.92)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 20px rgba(239,68,68,0.5)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              UNDER ATTACK
            </div>
          )}
          {isDefending && (
            <div style={{
              background: 'rgba(13,148,251,0.92)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 20px rgba(13,148,251,0.5)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              DEFENDED
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
