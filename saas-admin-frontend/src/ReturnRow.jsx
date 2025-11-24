import React from 'react'
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

export default function ReturnRow({ r, apiKey, onUpdate }){
  async function reRun(){
    const headers = { 'x-api-key': apiKey }
    const res = await fetch(`${API}/api/returns/${r.id}/run`, { method: 'POST', headers })
    const json = await res.json()
    if(json.doc) onUpdate(json.doc)
  }
  async function accept(){
    const updated = { ...r, actualDisposition: r.suggestedDisposition }
    const headers = { 'Content-Type':'application/json', 'x-api-key': apiKey }
    const res = await fetch(`${API}/api/returns/${r.id}`, { method: 'PUT', headers, body: JSON.stringify(updated) })
    const json = await res.json()
    if(json.doc) onUpdate(json.doc)
  }
  return (
    <tr>
      <td><strong>{r.id}</strong><div className="muted">{r.orderId}</div></td>
      <td>{r.productName}<div className="muted">{r.product_category} • ₹{r.product_price}</div></td>
      <td>{r.return_reason}</td>
      <td>{r.fraud_score}</td>
      <td><strong>{r.suggestedDisposition ?? '—'}</strong><div className="muted">conf: {r.suggestionConfidence ?? '-'}</div></td>
      <td>
        <button className="btn" onClick={reRun}>Re-run ML</button>
        <button className="btn secondary" onClick={accept} style={{marginLeft:8}}>Accept</button>
      </td>
    </tr>
  )
}
