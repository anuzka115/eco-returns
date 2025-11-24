// src/components/OrdersList.jsx
import React from 'react'

export default function OrdersList({ orders, onReturn }) {
  if (!orders?.length) return <div className="p-6 text-slate-500">No orders yet.</div>
  return (
    <div className="space-y-3">
      {orders.map(o => (
        <div key={o.id} className="bg-white rounded-md p-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="font-medium">{o.productName}</div>
            <div className="text-xs text-slate-400">Order {o.id} • {new Date(o.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">₹{o.productPrice}</div>
            <button onClick={() => onReturn(o.id)} className="px-3 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-sm">Return</button>
          </div>
        </div>
      ))}
    </div>
  )
}
