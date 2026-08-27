function getBackendUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    return envUrl.replace(/\/$/, '')
  }
  
  // Auto-detect Render cloud deployment
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    const backendHost = window.location.hostname.replace('frontend', 'backend')
    return `${window.location.protocol}//${backendHost}`
  }

  // If envUrl is just domain like "merchant-shadow-backend.onrender.com"
  if (envUrl && envUrl.includes('onrender.com')) {
    return `https://${envUrl.replace(/\/$/, '')}`
  }

  return 'http://localhost:8000'
}

const cleanApiUrl = getBackendUrl()

export const API_BASE = `${cleanApiUrl}/api`
export const WS_BASE = `${cleanApiUrl.replace(/^http/, 'ws')}/api`

export async function fetchMerchants() {
  const res = await fetch(`${API_BASE}/merchants`)
  if (!res.ok) throw new Error('Failed to fetch merchants')
  return res.json()
}

export async function createMerchant(data) {
  const res = await fetch(`${API_BASE}/merchants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create merchant')
  return res.json()
}

export async function updateMerchant(id, data) {
  const res = await fetch(`${API_BASE}/merchants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update merchant')
  return res.json()
}

export async function deleteMerchant(id) {
  const res = await fetch(`${API_BASE}/merchants/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete merchant')
  return res.json()
}

export async function createBattleSession(merchantId) {
  const res = await fetch(`${API_BASE}/arena/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: merchantId }),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function getAttackDistribution() {
  const res = await fetch(`${API_BASE}/dashboard/attack-distribution`)
  if (!res.ok) throw new Error('Failed to fetch distribution')
  return res.json()
}

export async function getGenerationTimeline() {
  const res = await fetch(`${API_BASE}/dashboard/generation-timeline`)
  if (!res.ok) throw new Error('Failed to fetch timeline')
  return res.json()
}

export async function startVaccinationScan(merchantId) {
  const res = await fetch(`${API_BASE}/vaccination/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: merchantId }),
  })
  if (!res.ok) throw new Error('Failed to start scan')
  return res.json()
}

export function getReportPdfUrl(scanId) {
  return `${API_BASE}/vaccination/report/${scanId}/pdf`
}
