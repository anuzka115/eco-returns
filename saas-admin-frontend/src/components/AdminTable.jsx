import React from 'react'
import ReturnRow from './ReturnRow'

export default function AdminTable({ returnsList = [], onReRun, onAccept, onOpen }) {
  return (
    <div className="panel" style={{overflowX:'auto'}}>
      <table className="admin-table" cellSpacing="0">
        <thead>
          <tr>
            <th>Return</th><th>Product</th><th>Reason</th><th>Fraud</th><th>Suggestion</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {returnsList.map(r => (
            <ReturnRow key={r.id} r={r} onReRun={onReRun} onAccept={onAccept} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
