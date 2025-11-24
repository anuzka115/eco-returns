import React from 'react'

export default function ReturnDetail({ doc, onClose }) {
  if (!doc) return null

  const probs = doc.suggestionProbs || doc.probabilities || (doc.saasResponse?.doc?.suggestionProbs) || {}

  return (
    <div className="return-detail-backdrop" onClick={onClose}>
      <div className="return-detail" onClick={(e) => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h3 style={{margin:0}}>{doc.productName}</h3>
            <div className="muted" style={{marginTop:6}}>{doc.product_category} • Order {doc.orderId}</div>
          </div>
          <div>
            <button className="er-btn er-btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:18}}>
          <div>
            <div className="detail-row"><div className="label">Return reason</div><div>{doc.return_reason}</div></div>
            <div className="detail-row" style={{marginTop:8}}><div className="label">Inspection</div><div>{doc.inspection_status}</div></div>
            <div className="detail-row" style={{marginTop:8}}><div className="label">Fraud score</div><div>{doc.fraud_score ?? doc.fraudScore ?? 0}</div></div>
          </div>

          <div>
            <div style={{fontWeight:700, marginBottom:6}}>ML suggestion</div>
            <div style={{fontSize:18, fontWeight:700}}>{doc.suggestedDisposition ?? (doc.saasResponse?.doc?.suggestedDisposition ?? '—')}</div>
            <div className="muted" style={{marginTop:6}}>confidence: {Math.round((doc.suggestionConfidence||0)*100)}%</div>

            <div className="prob-grid" style={{marginTop:12}}>
              {Object.entries(probs).length === 0 ? <div className="muted">No probability details</div> :
                Object.entries(probs).map(([k,v]) => (
                  <div className="prob-item" key={k}>
                    <div className="prob-name">{k}</div>
                    <div className="prob-bar">
                      <div className="prob-fill" style={{width:`${Math.round(v*100)}%`}}></div>
                    </div>
                    <div style={{minWidth:44, textAlign:'right'}}>{Math.round(v*100)}%</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:16}}>
          <button className="er-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
