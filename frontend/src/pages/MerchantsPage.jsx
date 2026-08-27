import { useState, useEffect } from 'react'
import { fetchMerchants, createMerchant, updateMerchant, deleteMerchant } from '../hooks/api'

const CATEGORIES = ['Electronics', 'Grocery', 'Fashion', 'Health', 'Books', 'Home', 'Sports', 'Automotive']

const RISK_COLOR = (score) => {
  if (score >= 70) return '#EF4444'
  if (score >= 45) return '#F97316'
  if (score >= 25) return '#EAB308'
  return '#22C55E'
}

function MerchantForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', category: 'Electronics', monthly_gmv: '', config: {
      dynamic_pricing: true, return_window: 7, coupon_policy: 'single',
    }
  })
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setConf = (key, val) => setForm(f => ({ ...f, config: { ...f.config, [key]: val } }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, monthly_gmv: parseFloat(form.monthly_gmv) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="form-group">
        <label className="form-label">Merchant Name</label>
        <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Kirana.ai Electronics" />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Monthly GMV (INR)</label>
          <input className="form-input" type="number" value={form.monthly_gmv} onChange={e => set('monthly_gmv', e.target.value)} placeholder="e.g., 2800000" />
        </div>
      </div>
      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Configuration</div>
        <div className="grid-2" style={{ gap: '0.75rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Return Window (days)</label>
            <input className="form-input" type="number" min="0" max="90" value={form.config.return_window} onChange={e => setConf('return_window', parseInt(e.target.value))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Coupon Policy</label>
            <select className="form-select" value={form.config.coupon_policy} onChange={e => setConf('coupon_policy', e.target.value)}>
              <option value="none">None</option>
              <option value="single">Single only</option>
              <option value="stackable">Stackable</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2' }}>
            <input
              id="dyn-pricing"
              type="checkbox"
              checked={form.config.dynamic_pricing}
              onChange={e => setConf('dynamic_pricing', e.target.checked)}
              style={{ accentColor: 'var(--ac-dodger)', width: 16, height: 16 }}
            />
            <label htmlFor="dyn-pricing" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Dynamic Pricing Enabled
            </label>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save Merchant</button>
      </div>
    </form>
  )
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    try {
      const d = await fetchMerchants()
      setMerchants(d.merchants || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data) => {
    await createMerchant(data)
    setShowForm(false)
    load()
  }

  const handleUpdate = async (data) => {
    await updateMerchant(editingMerchant.id, data)
    setEditingMerchant(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this merchant?')) return
    setDeletingId(id)
    await deleteMerchant(id)
    setDeletingId(null)
    load()
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Merchant Profiles</h1>
          <p className="page-subtitle">Manage merchant configurations and defense profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingMerchant(null) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Merchant
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editingMerchant) && (
        <div className="card scale-in" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <span className="card-title">{editingMerchant ? 'Edit Merchant' : 'New Merchant'}</span>
          </div>
          <div className="card-body">
            <MerchantForm
              initial={editingMerchant}
              onSave={editingMerchant ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingMerchant(null) }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {merchants.map((m) => {
            const riskColor = RISK_COLOR(m.risk_score)
            const config = typeof m.config === 'object' ? m.config : {}
            return (
              <div key={m.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'var(--grad-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', fontWeight: 800, color: 'white',
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: 'var(--shadow-glow)',
                  }}>
                    {m.name?.charAt(0) || 'M'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{m.name}</span>
                      <span className="badge badge-blue">{m.category}</span>
                      {config.dynamic_pricing && <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>Dynamic Pricing</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>GMV: <strong style={{ color: 'var(--text-primary)' }}>₹{(m.monthly_gmv/100000).toFixed(1)}L/mo</strong></span>
                      <span>Return Window: <strong style={{ color: 'var(--text-primary)' }}>{config.return_window ?? '—'}d</strong></span>
                      <span>Coupons: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{config.coupon_policy || '—'}</strong></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {m.id?.slice(0, 8)}</span>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Risk Score</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: riskColor, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {m.risk_score?.toFixed(0) ?? '—'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setEditingMerchant(m); setShowForm(false) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? <div className="spinner" style={{ width: 12, height: 12 }}></div> : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {merchants.length === 0 && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No merchants yet. Add your first merchant to begin protection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
