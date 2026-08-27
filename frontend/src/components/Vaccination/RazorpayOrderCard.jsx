/**
 * RazorpayOrderCard — Displays the live Razorpay order created from a vaccination scan.
 * Shows order ID, amount, status, and distinguishes real vs mock mode.
 */

const formatINR = v => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function RazorpayOrderCard({ order }) {
  if (!order) return null

  const isReal = order._source === 'razorpay_live'
  const isFailed = order._source === 'failed' || order.error
  const orderId = order.id || '—'
  const amountINR = order._amount_inr || (order.amount ? order.amount / 100 : 0)
  const status = order.status || 'created'

  return (
    <div
      className="scale-in"
      style={{
        padding: '1rem 1.25rem',
        background: isFailed
          ? 'rgba(255,45,85,0.06)'
          : 'rgba(13,148,251,0.06)',
        border: `1px solid ${isFailed ? 'rgba(255,45,85,0.25)' : 'rgba(13,148,251,0.3)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: isFailed ? 'none' : '0 0 16px rgba(13,148,251,0.12)',
        animation: isFailed ? 'none' : 'borderPulse 2s ease infinite',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Razorpay logo-ish icon */}
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #072654 0%, #1a5dc8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 900,
            color: 'white',
            fontFamily: 'var(--font-head)',
          }}>
            R
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Razorpay Order Created
          </span>
        </div>

        {/* Source badge */}
        <span style={{
          padding: '0.2rem 0.55rem',
          borderRadius: 20,
          fontSize: '0.58rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          background: isReal ? 'rgba(57,255,20,0.1)' : isFailed ? 'rgba(255,45,85,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${isReal ? 'rgba(57,255,20,0.3)' : isFailed ? 'rgba(255,45,85,0.3)' : 'rgba(245,158,11,0.3)'}`,
          color: isReal ? 'var(--green-safe)' : isFailed ? 'var(--red-team)' : 'var(--amber-warn)',
        }}>
          {isReal ? '✓ LIVE API' : isFailed ? '✗ ERROR' : '◎ TEST MODE'}
        </span>
      </div>

      {isFailed ? (
        <p style={{ fontSize: '0.72rem', color: 'var(--red-team)' }}>
          {order.error || 'Order creation failed'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Order ID */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Order ID</span>
            <code style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ac-dodger)',
              background: 'rgba(13,148,251,0.08)',
              padding: '0.15rem 0.4rem',
              borderRadius: 4,
            }}>
              {orderId}
            </code>
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Remediation Budget</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ac-dodger)', fontFamily: 'var(--font-head)' }}>
              {formatINR(amountINR)}
            </span>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Status</span>
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: status === 'created' ? 'var(--green-safe)' : 'var(--amber-warn)',
            }}>
              ● {status}
            </span>
          </div>

          {/* Purpose note */}
          <div style={{
            marginTop: '0.35rem',
            padding: '0.4rem 0.6rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 6,
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Security remediation budget locked in Razorpay for merchant '{order.notes?.merchant_name || '—'}'. 
            Purpose: <em>{order.notes?.purpose?.replace(/_/g, ' ') || 'security remediation'}</em>.
          </div>
        </div>
      )}
    </div>
  )
}
