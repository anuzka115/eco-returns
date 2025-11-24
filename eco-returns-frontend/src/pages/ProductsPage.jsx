// src/pages/ProductsPage.jsx
import React from 'react'
import ProductList from '../components/ProductList'
import Login from '../components/Login'

export default function ProductsPage({ products, onAdd, currentUser, onLogin }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="panel lg:col-span-2">
        <h2>Products</h2>
        <ProductList products={products} onAdd={onAdd} />
      </section>

      <aside className="panel">
        <h3>Account</h3>
        {!currentUser ? <Login onLogin={onLogin} /> : (
          <>
            <div>Signed in as: <strong>{currentUser}</strong></div>
            <p style={{marginTop:8}}>Quick actions: view Orders / Returns</p>
          </>
        )}
      </aside>
    </div>
  )
}
