// src/pages/ReturnsPage.jsx
import React from 'react'
import ReturnForm from '../components/ReturnForm'

export default function ReturnsPage({ returns, currentUser, onCreateReturn, onUpdateReturn }) {
  const myReturns = returns.filter(r => r.userId === currentUser)

  return (
    <div>
      <h2>My Returns</h2>

      <div className="panel">
        <h3>Quick return</h3>
        <ReturnForm orders={[]} onSubmit={(orderId, payload) => onCreateReturn(orderId, payload)} />
      </div>

      <div className="panel" style={{marginTop:12}}>
        {myReturns.length === 0 ? <div>No returns yet.</div> : (
          <div className="returns-list">
            {myReturns.map(r => (
              <div key={r.id} className="return-card">
                <div>
                  <div className="product-name">{r.productName}</div>
                  <div>Reason: {r.return_reason}</div>
                  <div>Created: {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div>Status: {r.sentToSaaS ? 'Sent' : 'Local'}</div>
                  <div>
                    Suggested: {r.saasResponse?.doc?.suggestedDisposition || r.suggestedDisposition || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
