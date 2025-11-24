// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react'

const BACKEND = 'http://127.0.0.1:4000'

export default function AdminPanel({ returnsList = [], onUpdateReturn }) {
  const [list, setList] = useState(returnsList)         // local copy
  const [loading, setLoading] = useState(false)

  // fetch returns from Node backend
  async function fetchFromBackend() {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/returns`)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setList(json)
    } catch (err) {
      console.error('fetch returns failed', err)
      // fallback to local prop list
      setList(returnsList)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // load backend returns on mount
    fetchFromBackend()
    // optional: poll every 10s (comment out if not wanted)
    const t = setInterval(fetchFromBackend, 10000)
    return () => clearInterval(t)
  }, [])

  // when admin accepts suggestion, update on backend
  async function acceptSuggestion(r) {
    try {
      const updated = { ...r, actualDisposition: r.suggestedDisposition }
      const res = await fetch(`${BACKEND}/api/returns/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      if (!res.ok) throw new Error('update failed')
      const json = await res.json()
      // update local list & also notify parent if needed
      setList(prev => prev.map(x => x.id === r.id ? json.doc : x))
      if (onUpdateReturn) onUpdateReturn(json.doc)
      alert('Disposition accepted and saved on backend.')
    } catch (err) {
      console.error(err)
      alert('Could not save acceptance: ' + err.message)
    }
  }

  if (loading) return <div>Loading returns...</div>
  if (!list.length) return <div>No returns yet — create one in the Orders panel.</div>

  return (
    <div className="admin">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Return</th>
            <th>Product</th>
            <th>Reason</th>
            <th>Fraud</th>
            <th>Suggested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id}>
              <td style={{minWidth:220}}>
                <div><strong>{r.id}</strong></div>
                <div className="muted">order {r.orderId}</div>
                <div className="muted">sent: {r.sentToSaasAt ?? r.createdAt}</div>
              </td>
              <td>
                <div>{r.productName}</div>
                <div className="muted">{r.product_category} • ₹{r.product_price}</div>
              </td>
              <td>{r.return_reason} {r.inspection_status !== 'not_inspected' ? `• ${r.inspection_status}` : ''}</td>
              <td>{r.fraud_score}</td>
              <td>
                <div><strong>{r.suggestedDisposition ?? '—'}</strong></div>
                <div className="muted">conf: {r.suggestionConfidence ?? '-'}</div>
              </td>
              <td>
                <button className="btn" onClick={() => {
                  // re-run ML via backend endpoint
                  fetch(`${BACKEND}/api/returns/${r.id}/run`, { method: 'POST' })
                    .then(res => res.json())
                    .then(json => {
                      setList(prev => prev.map(x => x.id === r.id ? json.doc : x))
                      if (onUpdateReturn) onUpdateReturn(json.doc)
                    })
                    .catch(err => {
                      console.error(err)
                      alert('Re-run ML failed')
                    })
                }}>Re-run ML</button>

                <button className="btn secondary" onClick={() => acceptSuggestion(r)} style={{marginLeft:8}}>Accept</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
