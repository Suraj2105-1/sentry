import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

/**
 * AttackChart — Chart.js doughnut chart for attack vector distribution.
 */
export default function AttackChart({ distribution }) {
  if (!distribution || distribution.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
      }}>
        Loading distribution data...
      </div>
    )
  }

  const data = {
    labels: distribution.map(d => d.strategy),
    datasets: [{
      data: distribution.map(d => d.count),
      backgroundColor: distribution.map(d => d.color + '99'),
      borderColor: distribution.map(d => d.color),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        titleColor: '#111827',
        bodyColor: '#4B5563',
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed} attacks`,
        },
      },
    },
    cutout: '68%',
  }

  const total = distribution.reduce((a, b) => a + b.count, 0)

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {/* Doughnut chart */}
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        <Doughnut data={data} options={options} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-head)',
            lineHeight: 1,
          }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Total
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {distribution.map(d => {
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0
          return (
            <div key={d.strategy} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: d.color,
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.strategy}
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: d.color }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
