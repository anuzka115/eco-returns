// src/components/ProductCard.jsx
import React from 'react'

export default function ProductCard({ product, onBuy }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between h-full transition hover:shadow-md">
      <div>
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        <div className="text-sm text-slate-500">{product.category}</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">₹{product.price}</div>
          <div className="text-xs text-slate-400">Free returns within 15 days</div>
        </div>
        <button onClick={() => onBuy(product)} className="bg-primary text-white px-3 py-1 rounded-md shadow-sm hover:opacity-95 transition">
          Buy
        </button>
      </div>
    </div>
  )
}
