import React from 'react'

export default function Orders({ orders = [], onCreateReturn }) {
  if (!orders || orders.length === 0) {
    return <div className="muted">No orders yet.</div>
  }

  return (
    <div className="orders-list">
      {orders.map(o => (
        <div key={o.id} className="order-item">
          <div>
            <div style={{fontWeight:600}}>{o.productName}</div>
            <div className="meta">Order {o.id} • {new Date(o.createdAt).toLocaleDateString()}</div>
          </div>

          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <div style={{fontWeight:700}}>₹{o.productPrice}</div>
            <button className="er-btn-outline" onClick={() => onCreateReturn && onCreateReturn(o.id)}>Return</button>
          </div>
        </div>
      ))}
    </div>
  )
}
