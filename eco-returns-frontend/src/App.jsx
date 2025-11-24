// src/App.jsx
import React, { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import ProductList from './components/ProductList'
import Orders from './components/Orders'
import ReturnForm from './components/ReturnForm'
import Login from './components/Login'
import ProductsPage from './pages/ProductsPage' // optional
import OrdersPage from './pages/OrdersPage'
import ReturnsPage from './pages/ReturnsPage'
import sampleProducts from './data/products'
import { sendReturnToSaaS } from './api'
import { haversineKm } from '../saas-backend/utils/geo'   // <-- client-side haversine helper
const ADMIN_LOC = { lat: 22.7196, lon: 75.8577 } // Indore

export default function App() {
  const [page, setPage] = useState('products') // 'products' | 'orders' | 'returns'
  const [products] = useState(sampleProducts)

  // currentUser is stored as JSON object { id, location } or null
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // helper to get a stable user id (works if older code passes plain string)
  const getUserId = (u) => (typeof u === 'string' ? u : (u && u.id) ? u.id : null)

  // one onLogin handler only — accepts either string id OR object {id, location}
  function onLogin(payload) {
    const user = typeof payload === 'string' ? { id: payload, location: null } : payload
    setCurrentUser(user)
    try { localStorage.setItem('currentUser', JSON.stringify(user)) } catch {}
  }

  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orders') || '[]') } catch { return [] }
  })
  const [returns, setReturns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('returns') || '[]') } catch { return [] }
  })
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders])
  useEffect(() => localStorage.setItem('returns', JSON.stringify(returns)), [returns])

  // Persist currentUser whenever it changes (stringify)
  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser))
      else localStorage.removeItem('currentUser')
    } catch {}
  }, [currentUser])

  function addOrder(product, qty = 1) {
    const userId = getUserId(currentUser)
    if (!userId) return alert('Please sign in first')
    const order = {
      id: `ord_${Date.now()}_${Math.floor(Math.random()*999)}`,
      userId,
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      productPrice: product.price,
      weight_kg: product.weight_kg ?? 0.5,
      qty,
      createdAt: new Date().toISOString()
    }
    setOrders(prev => [order, ...prev])
  }

  // createReturn now uses currentUser as object and haversine distance
  async function createReturn(orderId, { return_reason, note='' }) {
    const userId = getUserId(currentUser)
    if (!userId) return alert('Please sign in first')
    const order = orders.find(o => o.id === orderId)
    if (!order) return alert('Order not found')
    setOrders(prev => prev.filter(o => o.id !== orderId))

    const days_since_purchase = Math.max(0, Math.round((Date.now() - new Date(order.createdAt)) / (1000*60*60*24)))

    // user location (if available)
    const userLoc = currentUser && currentUser.location && currentUser.location.lat && currentUser.location.lon
      ? { lat: Number(currentUser.location.lat), lon: Number(currentUser.location.lon) }
      : null

    const distance_km = userLoc ? haversineKm(ADMIN_LOC, userLoc) : Math.round(20 + Math.random()*120) // fallback random if unknown

    const customer_return_count_90d = orders.filter(o =>
      o.userId === userId &&
      o.createdAt &&
      ((Date.now()-new Date(o.createdAt))/(1000*60*60*24) <= 90)
    ).length - 1

    const order_value_ratio = 1.0

    let fraud_score = 0.0
    if (customer_return_count_90d > 3) fraud_score += 0.3
    if (order.productPrice > 500) fraud_score += 0.2
    if (days_since_purchase <= 3) fraud_score += 0.15
    fraud_score = Math.min(1, parseFloat(fraud_score.toFixed(3)))

    const returnDoc = {
      id: `ret_${Date.now()}_${Math.floor(Math.random()*999)}`,
      orderId: order.id,
      userId,
      merchantId: 'm_demo',
      productId: order.productId,
      productName: order.productName,
      product_category: order.productCategory,
      product_price: order.productPrice,
      qty: order.qty,
      weight_kg: order.weight_kg ?? 0.5,
      return_reason,
      note,
      days_since_purchase,
      distance_km,
      customer_return_count_90d,
      order_value_ratio,
      fraud_score,
      inspection_status: 'not_inspected',
      previous_refurb_count: 0,
      suggestedDisposition: 'pending',
      createdAt: new Date().toISOString(),
      user_location: userLoc // optional: send the raw user coords to SaaS
    }

    try {
  const res = await sendReturnToSaaS(returnDoc)
  if (res && res.success) {
    const stored = { ...returnDoc, sentToSaaS: true, saasResponse: res.body, updatedAt: new Date().toISOString() }
    setReturns(prev => [stored, ...prev])
    
    // 🔥 Remove from My Orders
    setOrders(prev => prev.filter(o => o.id !== orderId))

    alert('Return sent to SaaS for admin review')
  } else {
    const stored = { ...returnDoc, sentToSaaS: false, updatedAt: new Date().toISOString() }
    setReturns(prev => [stored, ...prev])

    // 🔥 Remove from My Orders
    setOrders(prev => prev.filter(o => o.id !== orderId))

    alert('SaaS unreachable — return saved locally for demo')
  }
} catch (err) {
  const stored = { ...returnDoc, sentToSaaS: false, updatedAt: new Date().toISOString() }
  setReturns(prev => [stored, ...prev])

  // 🔥 Remove from My Orders
  setOrders(prev => prev.filter(o => o.id !== orderId))

  console.error('Error sending to SaaS:', err)
  alert('Error sending to SaaS — return saved locally for demo')
}

  }

  function updateReturn(updated) {
    setReturns(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  function signOut() {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  // small helpers (use the normalized id)
  const currentUserId = getUserId(currentUser)
  const myOrders = orders.filter(o => o.userId === currentUserId)
  const myReturns = returns.filter(r => r.userId === currentUserId)

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        title="Eco-Returns Demo"
        user={currentUser}
        onSignOut={signOut}
        onNavigate={setPage}
        currentPage={page}
        onOpenLogin={() => setShowLogin(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {page === 'products' && (
          <section>
            <h2>Products</h2>
            <ProductList products={products} onAdd={addOrder} />
          </section>
        )}

        {page === 'orders' && (
          <section>
            <h2>My Orders</h2>
            <Orders orders={myOrders} onCreateReturn={(orderId) => {
              const reason = prompt('Return reason (e.g. defective, changed_mind):', 'not_as_described')
              if (!reason) return
              createReturn(orderId, { return_reason: reason })
            }} />
          </section>
        )}

        {page === 'returns' && (
          <section>
            <h2>My Returns</h2>

            <div className="panel">
              <h3>Quick return</h3>
              <ReturnForm orders={myOrders} onSubmit={(orderId, payload) => createReturn(orderId, payload)} />
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
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
                        <div>Suggested: {r.saasResponse?.doc?.suggestedDisposition || r.suggestedDisposition || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Login modal */}
      {showLogin && (
        <div className="login-overlay" role="dialog" aria-modal="true" onClick={() => setShowLogin(false)}>
          <div className="login-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Sign in</h3>
            <Login onLogin={(payload) => {
              onLogin(payload)    // accept either string or object
              setShowLogin(false)
              setPage('orders')
            }} />
            <div style={{marginTop:10, textAlign:'right'}}>
              <button className="btn-ghost" onClick={() => setShowLogin(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-slate-500">
          Ecommerce demo — returns are forwarded to the SaaS backend for ML suggestions.
        </div>
      </footer>
    </div>
  )
}
