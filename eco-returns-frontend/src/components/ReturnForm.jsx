import React, { useState } from 'react'

export default function ReturnForm({ orders = [], onSubmit }) {
  const [orderId, setOrderId] = useState(orders?.[0]?.id || '')
  const [reason, setReason] = useState('not_as_described')
  const [note, setNote] = useState('')

  function submit(e){
    e.preventDefault()
    if (!orderId) return alert('Please select an order')
    if (!onSubmit) return alert('No submit handler configured')
    onSubmit(orderId, { return_reason: reason, note })
    // reset note (not order)
    setNote('')
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="form-row">
        <label>Which order?</label>
        <select value={orderId} onChange={e=>setOrderId(e.target.value)}>
          <option value="">-- select order --</option>
          {orders.map(o => <option key={o.id} value={o.id}>{o.productName} — {o.id}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Reason</label>
        <select value={reason} onChange={e=>setReason(e.target.value)}>
          <option value="not_as_described">not_as_described</option>
          <option value="defective">defective</option>
          <option value="size_issue">size_issue</option>
          <option value="changed_mind">changed_mind</option>
          <option value="late_delivery">late_delivery</option>
        </select>
      </div>

      <div className="form-row">
        <label>Note (optional)</label>
        <input type="text" placeholder="Short note for admin" value={note} onChange={e=>setNote(e.target.value)} />
      </div>

      <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
        <button type="submit" className="er-btn">Initiate Return</button>
      </div>
    </form>
  )
}
