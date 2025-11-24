import React from 'react'

export default function ReturnRow({ r, apiKey, onReRun, onAccept, onOpen }) {
  return (
    <tr>
      <td style={{padding:12}}>
        <div style={{fontWeight:600}}>{r.id}</div>
        <div className="muted" style={{fontSize:12}}>order {r.orderId}</div>
      </td>

      <td style={{padding:12}}>
        <div>{r.productName}</div>
        <div className="muted" style={{fontSize:12}}>{r.product_category}</div>
      </td>

      <td style={{padding:12}}>{r.return_reason}</td>
      <td style={{padding:12}}>{(r.fraud_score ?? r.fraudScore ?? '-')}</td>

      <td style={{padding:12}}>
        <div style={{fontWeight:700}}>{r.suggestedDisposition ?? (r.saasResponse?.doc?.suggestedDisposition ?? '—')}</div>
        <div style={{marginTop:6}}>
          <div className="conf-bar" style={{width:120}}>
            <div className="conf-fill" style={{width: `${Math.round((r.suggestionConfidence||0)*100)}%`}}></div>
          </div>
        </div>
      </td>

      <td style={{padding:12}}>
        <div style={{display:'flex', gap:8}}>
          <button className="er-btn-outline" onClick={() => onOpen && onOpen(r)}>Details</button>
          <button className="er-btn" onClick={() => onReRun && onReRun(r)}>Re-run</button>
          <button className="er-btn-success" onClick={() => onAccept && onAccept(r)}>Accept</button>
        </div>
      </td>
    </tr>
  )
}
