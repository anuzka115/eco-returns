// src/pages/OrdersPage.jsx
import React from 'react'
import Orders from '../components/Orders'

export default function OrdersPage({ orders, onCreateReturn, currentUser }) {
  const myOrders = orders.filter(o => o.userId === currentUser)
  return (
    <div>
      <h2>My Orders</h2>
      <div className="panel">
        <Orders orders={myOrders} onCreateReturn={onCreateReturn} />
      </div>
    </div>
  )
}
