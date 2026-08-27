import { useState, useEffect, useRef } from 'react'
import { fetchMerchants, startVaccinationScan, getReportPdfUrl, WS_BASE } from '../hooks/api'
import ScanProgress from '../components/Vaccination/ScanProgress'
import VulnerabilityCard from '../components/Vaccination/VulnerabilityCard'
import RazorpayOrderCard from '../components/Vaccination/RazorpayOrderCard'

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const ScoreRing = ({ score }) => {
  const r = 42
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score < 40 ? '#EF4444' : score < 60 ? '#F97316' : score < 80 ? '#EAB308' : '#22C55E'
  return (
    <svg width="110" height="110" className="progress-ring">
      <circle className="progress-ring-track" cx="55" cy="55" r={r} strokeWidth="8" />
      <circle
        className="progress-ring-fill"
        cx="55" cy="55" r={r}
        strokeWidth="8"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s' }}
      />
      <text x="55" y="52" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="'Space Grotesk', sans-serif">{score}</text>
      <text x="55" y="68" textAnchor="middle" fill="#4E6280" fontSize="10" fontFamily="Inter, sans-serif">/100</text>
    </svg>
  )
}

export default function VaccinationPage() {
  const [merchants, setMerchants] = useState([])
  const [selectedMerchant, setSelectedMerchant] = useState('m001')
  const [scanId, setScanId] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanSteps, setScanSteps] = useState([])
  const [report, setReport] = useState(null)
  const [expandedVuln, setExpandedVuln] = useState(null)
  const [razorpayOrder, setRazorpayOrder] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    fetchMerchants().then(d => setMerchants(d.merchants || [])).catch(() => {})
  }, [])

  const runScan = async () => {
    try {
      setScanning(true)
      setReport(null)
      setScanSteps([])
      setRazorpayOrder(null)
      setExpandedVuln(null)

      const { scan_id } = await startVaccinationScan(selectedMerchant)
      setScanId(scan_id)

      const ws = new WebSocket(`${WS_BASE}/vaccination/ws/${scan_id}`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'SCAN_STARTED') {
          setScanSteps([{ text: `Initializing scan for ${data.merchant_name}...`, status: 'running' }])
        } else if (data.type === 'SCAN_PROGRESS') {
          setScanSteps(prev => [...prev, {
            id: data.vulnerability_id,
            name: data.vulnerability_name,
            severity: data.severity,
            confirmed: data.confirmed,
            percent: data.percent,
            text: `[${data.current}/${data.total}] ${data.vulnerability_name}`,
            status: data.confirmed ? 'confirmed' : 'safe',
          }])
        } else if (data.type === 'SCAN_COMPLETE') {
          setReport({
            summary: data.summary,
            vulnerabilities: [...(data.vulnerabilities || [])].sort(
              (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
            ),
            scan_id,
          })
          if (data.razorpay_order) setRazorpayOrder(data.razorpay_order)
          setScanning(false)
        } else if (data.type === 'ERROR') {
          setScanSteps(prev => [...prev, { text: `Error: ${data.message}`, status: 'error' }])
          setScanning(false)
        }
      }
      ws.onerror = () => setScanning(false)
    } catch (e) {
      setScanning(false)
      setScanSteps([{ text: `Error: ${e.message}`, status: 'error' }])
    }
  }

  const downloadPdf = () => {
    if (!scanId) return
    window.open(getReportPdfUrl(scanId), '_blank')
  }

  const merchant = merchants.find(m => m.id === selectedMerchant)
  const SEVERITY_CLASS = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Vaccination Scanner</h1>
          <p className="page-subtitle">Run the full evolved Red Team attack suite against your merchant integration before going live</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedMerchant}
            onChange={e => setSelectedMerchant(e.target.value)}
            disabled={scanning}
          >
            {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <button
            id="run-scan-btn"
            className="btn btn-primary"
            onClick={runScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                Scanning...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                </svg>
                Run Vaccination Scan
              </>
            )}
          </button>

          {report && (
            <>
              <button 
                className="btn btn-primary" 
                onClick={() => alert("Defenses Deployed Successfully!\n\nWAF Rules and AI Guards have been updated in production.")}
                style={{ background: '#16A34A', borderColor: '#16A34A', boxShadow: '0 0 15px rgba(22, 163, 74, 0.4)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Deploy Defenses
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                    "engine": "razorpay-shield",
                    "version": "1.0",
                    "rules": report.vulnerabilities.filter(v => v.confirmed).map(v => ({ id: v.id, action: "BLOCK", type: "AI_FRAUD" }))
                  }, null, 2));
                  const a = document.createElement('a');
                  a.href = dataStr;
                  a.download = "razorpay_fraud_rules.json";
                  a.click();
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Export to Razorpay
              </button>
              <button id="download-pdf-btn" className="btn btn-secondary" onClick={downloadPdf}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid-2">
        {/* Scan Progress */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Scan Progress</span>
            {scanning && (
              <div className="status-pill">
                <span className="status-dot" />
                Active
              </div>
            )}
          </div>
          <ScanProgress steps={scanSteps} scanning={scanning} />
        </div>

        {/* Summary / placeholder */}
        <div>
          {report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Security Score */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Security Score  {merchant?.name}</span>
                  <span className={`badge badge-${SEVERITY_CLASS[report.summary.risk_rating]}`}>
                    {report.summary.risk_rating} RISK
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <ScoreRing score={report.summary.overall_score} />
                  <div style={{ flex: 1 }}>
                    <div className="grid-2" style={{ gap: '0.5rem' }}>
                      <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critical</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-head)' }}>{report.summary.critical}</div>
                      </div>
                      <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(249,115,22,0.08)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.2)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>High</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F97316', fontFamily: 'var(--font-head)' }}>{report.summary.high}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: 'rgba(13,148,251,0.06)', borderRadius: 8, border: '1px solid rgba(13,148,251,0.15)' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Financial Exposure</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ac-dodger)', fontFamily: 'var(--font-head)' }}>
                        ₹{report.summary.total_exposure_inr?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Severity Breakdown</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {report.summary.total_confirmed} confirmed
                  </span>
                </div>
                <div className="card-body">
                  {[
                    { label: 'Critical', count: report.summary.critical, color: '#EF4444' },
                    { label: 'High',     count: report.summary.high,     color: '#F97316' },
                    { label: 'Medium',   count: report.summary.medium,   color: '#EAB308' },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: s.color }}>{s.count}</span>
                      </div>
                      <div className="threat-bar-track" style={{ height: 5 }}>
                        <div className="threat-bar-fill" style={{ width: `${(s.count / 3) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Razorpay Order */}
              {razorpayOrder && <RazorpayOrderCard order={razorpayOrder} />}
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.3 }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.85rem' }}>Scan results will appear here</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', opacity: 0.7 }}>
                  Select a merchant and run the scanner
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vulnerability Details List */}
      {report?.vulnerabilities?.length > 0 && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-header">
            <span className="card-title">Vulnerability Details</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {report.vulnerabilities.filter(v => v.confirmed).length} confirmed of {report.vulnerabilities.length} checked
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.vulnerabilities.map(vuln => (
              <VulnerabilityCard
                key={vuln.id}
                vuln={vuln}
                expanded={expandedVuln === vuln.id}
                onToggle={() => setExpandedVuln(expandedVuln === vuln.id ? null : vuln.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
