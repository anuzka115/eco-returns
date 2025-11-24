// src/components/AdminTable.jsx
import React, { useState } from 'react'

function ConfidenceBar({ value=0 }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
      <div style={{width: `${pct}%`}} className="h-full bg-accent transition-all"></div>
    </div>
  )
}

export default function AdminTable({ returnsList=[], onReRun, onAccept, onOpen }) {
  return (
    <table className="min-w-full bg-white rounded-md overflow-hidden">
      <thead className="bg-slate-50 text-left text-sm text-slate-500">
        <tr>
          <th className="p-3">Return</th>
          <th className="p-3">Product</th>
          <th className="p-3">Reason</th>
          <th className="p-3">Fraud</th>
          <th className="p-3">Suggestion</th>
          <th className="p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {returnsList.map(r => (
          <tr key={r.id} className="border-t">
            <td className="p-3">
              <div className="font-medium">{r.id}</div>
              <div className="text-xs text-slate-400">{r.orderId}</div>
            </td>
            <td className="p-3">
              <div>{r.productName}</div>
              <div className="text-xs text-slate-400">{r.product_category}</div>
            </td>
            <td className="p-3">{r.return_reason}</td>
            <td className="p-3">{r.fraud_score ?? '-'}</td>
            <td className="p-3">
              <div className="font-semibold">{r.suggestedDisposition ?? '—'}</div>
              <div className="mt-2"><ConfidenceBar value={r.suggestionConfidence} /></div>
            </td>
            <td className="p-3">
              <div className="flex gap-2">
                <button onClick={()=>onOpen(r)} className="btn px-3 py-1 bg-slate-50 rounded-md">Details</button>
                <button onClick={()=>onReRun(r)} className="btn px-3 py-1 bg-primary text-white rounded-md">Re-run</button>
                <button onClick={()=>onAccept(r)} className="btn px-3 py-1 bg-success text-white rounded-md">Accept</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
