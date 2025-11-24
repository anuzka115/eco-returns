// src/components/CarbonDashboard.jsx
import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

function safeNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// Small pie SVG renderer (returns JSX)
function PieSVG({ data = {}, size = 180, stroke = '#fff' }) {
  const entries = Object.entries(data).filter(([, v]) => Number(v) > 0)
  if (entries.length === 0) return <div className="no-chart">No data</div>

  const total = entries.reduce((s, [, v]) => s + Number(v), 0)
  let acc = 0
  return (
    <svg className="pie-svg" viewBox="-1 -1 2 2" width={size} height={size} role="img" aria-hidden>
      {entries.map(([k, v], i) => {
        const start = (acc / total) * Math.PI * 2
        acc += Number(v)
        const end = (acc / total) * Math.PI * 2
        const x1 = Math.cos(start)
        const y1 = Math.sin(start)
        const x2 = Math.cos(end)
        const y2 = Math.sin(end)
        const largeArc = end - start > Math.PI ? 1 : 0
        const d = `M0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`
        return <path key={k} d={d} fill={pieColor(i)} stroke={stroke} strokeWidth="0.005" />
      })}
      {/* center white circle to make donut-ish */}
      <circle cx="0" cy="0" r="0.4" fill="#fff" />
    </svg>
  )
}

function pieColor(i) {
  const palette = ['#6ac6ff', '#8affc1', '#ffd56a', '#ffa3a3', '#c6b3ff', '#b3d4ff']
  return palette[i % palette.length]
}

export default function CarbonDashboard({ apiKey }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [returnsList, setReturnsList] = useState(null) // used to compute donated orders count

  useEffect(() => {
    if (apiKey) fetchAll()
    else {
      setMetrics(null)
      setReturnsList(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const headers = apiKey ? { 'x-api-key': apiKey } : {}
      // fetch metrics and returns in parallel
      const [mRes, rRes] = await Promise.all([
        fetch(`${API}/api/metrics/carbon`, { headers }),
        fetch(`${API}/api/returns`, { headers })
      ])

      if (!mRes.ok) {
        const txt = await mRes.text()
        throw new Error('metrics fetch failed: ' + (txt || mRes.status))
      }
      if (!rRes.ok) {
        const txt = await rRes.text()
        throw new Error('returns fetch failed: ' + (txt || rRes.status))
      }

      const mJson = await mRes.json()
      const rJson = await rRes.json()

      setMetrics(mJson)
      setReturnsList(rJson)
    } catch (err) {
      console.error('CarbonDashboard fetch error', err)
      setError(err.message || String(err))
      setMetrics(null)
      setReturnsList(null)
    } finally {
      setLoading(false)
    }
  }

  // defensive numbers
  const totalConfirmed = safeNum(metrics?.totalConfirmedKg)
  const totalEstimated = safeNum(metrics?.totalEstimatedKg)
  const totalAll = totalConfirmed + totalEstimated

  // donated orders count (count of returns with actualDisposition === 'donate')
  const donatedOrdersCount = Array.isArray(returnsList)
    ? returnsList.filter(r => (r.actualDisposition || r.actual_disposition || '').toString().toLowerCase() === 'donate').length
    : 0

  // breakdown objects (confirmed only)
  const byDisposition = metrics?.byDisposition || {}
  const byCategory = metrics?.byCategory || {}

  return (
    <div className="dashboard-card" role="region" aria-label="Carbon dashboard">
      <div className="dash-header">
        <div className="dash-actions">
          <button className="btn" onClick={fetchAll} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      { !apiKey ? (
        <div className="dash-empty">Admin not authenticated — metrics require admin API key.</div>
      ) : error ? (
        <div className="dash-error">Error loading dashboard: {error}</div>
      ) : (!metrics && !loading) ? (
        <div className="dash-empty">No sustainability metrics yet.</div>
      ) : (
        <div className="dash-body">
          <div className="dash-stats">
            <div className="stat-row">
              <div className="stat-label">Saved carbon footprint</div>
              <div className="stat-value">{totalAll.toFixed(2)} kg</div>
            </div>
            <div className="stat-row">
              <div className="stat-label">Donated Orders</div>
              <div className="stat-value">{donatedOrdersCount}</div>
            </div>
          </div>

          <div className="dash-charts">
            <div className="chart-area">
              <div className="chart-title">By disposition</div>
              <PieSVG data={byDisposition} />
              <Legend data={byDisposition} />
            </div>

            <div className="chart-area">
              <div className="chart-title">By category</div>
              <PieSVG data={byCategory} />
              <Legend data={byCategory} />
            </div>
          </div>
        </div>
      )}
      <div className="dash-note">Note: confirmed numbers are from accepted returns; estimated are auto-calculated.</div>
    </div>
  )
}

// small legend component
function Legend({ data = {} }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null
  return (
    <ul className="legend">
      {entries.map(([k, v], i) => (
        <li key={k}><span className="legend-swatch" style={{ background: pieColor(i) }} /> {k} — {Number(v).toFixed(2)} kg</li>
      ))}
    </ul>
  )
}
