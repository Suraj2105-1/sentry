/**
 * BenchmarkChart — Dual-axis Chart.js line chart showing Blue Team block rate
 * rising and average attack impact falling across generations.
 */
import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

import { API_BASE } from '../../hooks/api'

export default function BenchmarkChart({ merchants = [] }) {
  const [selectedMerchant, setSelectedMerchant] = useState(merchants[0]?.id || 'm001')
  const [generations, setGenerations] = useState(20)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const runBenchmark = async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/arena/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: selectedMerchant, generations }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const chartData = result ? {
    labels: result.curve.map(g => `G${g.generation}`),
    datasets: [
      {
        label: 'Blue Block Rate',
        data: result.curve.map(g => +(g.block_rate * 100).toFixed(1)),
        borderColor: '#0D94FB',
        backgroundColor: 'rgba(13,148,251,0.07)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#0D94FB',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Avg Attack Impact (₹)',
        data: result.curve.map(g => Math.round(g.avg_impact_inr)),
        borderColor: '#FF2D55',
        backgroundColor: 'rgba(255,45,85,0.05)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#FF2D55',
        tension: 0.4,
        fill: false,
        yAxisID: 'y2',
      },
    ],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#8892A4',
          font: { size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        titleColor: '#111827',
        bodyColor: '#4B5563',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#8892A4', font: { size: 10 } },
      },
      y: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#0D94FB',
          font: { size: 10 },
          callback: v => `${v}%`,
        },
        title: { display: true, text: 'Block Rate %', color: '#0D94FB', font: { size: 10 } },
        min: 0,
        max: 100,
      },
      y2: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#FF2D55',
          font: { size: 10 },
          callback: v => `₹${v.toLocaleString('en-IN')}`,
        },
        title: { display: true, text: 'Avg Impact ₹', color: '#FF2D55', font: { size: 10 } },
      },
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ width: 200 }}
          value={selectedMerchant}
          onChange={e => setSelectedMerchant(e.target.value)}
          disabled={running}
        >
          {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select
          className="form-select"
          style={{ width: 120 }}
          value={generations}
          onChange={e => setGenerations(Number(e.target.value))}
          disabled={running}
        >
          {[10, 15, 20, 25, 30].map(g => (
            <option key={g} value={g}>{g} gens</option>
          ))}
        </select>

        <button
          id="run-benchmark-btn"
          className="btn btn-primary"
          onClick={runBenchmark}
          disabled={running}
        >
          {running ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              Running...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Run Benchmark
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,45,85,0.08)',
          border: '1px solid rgba(255,45,85,0.2)',
          borderRadius: 8,
          fontSize: '0.75rem',
          color: 'var(--red-team)',
        }}>
          Error: {error}. Is the backend running on port 8000?
        </div>
      )}

      {/* Summary stats */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {[
            { label: 'Gen 1 Block Rate', value: `${(result.summary.gen1_block_rate * 100).toFixed(1)}%`, color: 'var(--text-secondary)' },
            { label: `Gen ${result.generations} Block Rate`, value: `${(result.summary.final_block_rate * 100).toFixed(1)}%`, color: 'var(--ac-dodger)' },
            { label: 'Harm Prevented', value: `₹${Math.round(result.summary.total_harm_prevented_inr).toLocaleString('en-IN')}`, color: 'var(--green-safe)' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '0.6rem 0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-head)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 260, position: 'relative' }}>
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            opacity: 0.5,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            <p style={{ fontSize: '0.78rem' }}>
              Select a merchant and click Run Benchmark
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
