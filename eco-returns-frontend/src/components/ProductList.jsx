import React from 'react'

export default function ProductList({ products = [], onAdd }) {
  return (
    <div className="product-grid">
      {products.map(p => (
        <div key={p.id} className="product-card">
          <div>
            <div className="title">{p.name}</div>
            <div className="meta">{p.category}</div>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
            <div>
              <div className="price">₹{p.price}</div>
              <div className="small muted">Free returns within 15 days</div>
            </div>
            <button className="er-btn" onClick={() => onAdd && onAdd(p)}>Buy</button>
          </div>
        </div>
      ))}
    </div>
  )
}
