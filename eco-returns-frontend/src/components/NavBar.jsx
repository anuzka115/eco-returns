// src/components/NavBar.jsx
import React from 'react'

export default function NavBar({
  title = 'Eco-Returns Demo',
  user,
  onSignOut,
  onNavigate,
  currentPage,
  onOpenLogin // ← expected prop, may be undefined (we guard below)
}) {
  const navClass = (p) => p === currentPage ? 'nav-btn active' : 'nav-btn'

  // --------- NEW: safe display name handling ----------
  // user may be:
  // - null (not logged in)
  // - a string id (older code)
  // - an object { id, location }
  const displayName = (() => {
    if (!user) return null
    if (typeof user === 'string') return user
    if (typeof user === 'object' && user.id) return user.id
    return String(user)
  })()

  // optional small location label if user provided a city/coords
  const locationLabel = (user && user.location)
    ? (user.location.city ? user.location.city : (user.location.lat && user.location.lon ? `${user.location.lat}, ${user.location.lon}` : null))
    : null

  return (
    <header className="topbar">
      <div className="left">
        <div className="brand">ER</div>
        <div className="title-block">
          <div className="title">{title}</div>
          <div className="subtitle">Returns made simple</div>
        </div>
      </div>

      <nav className="nav" role="navigation" aria-label="Main">
        {/* guard onNavigate in case parent didn't pass it */}
        <button className={navClass('products')} onClick={() => onNavigate && onNavigate('products')}>Products</button>
        <button className={navClass('orders')} onClick={() => onNavigate && onNavigate('orders')}>My Orders</button>
        <button className={navClass('returns')} onClick={() => onNavigate && onNavigate('returns')}>Returns</button>
      </nav>

      <div className="right">
        {!displayName ? (
          <>
            <div className="user">Not signed in</div>
            {/* guard onOpenLogin */}
            <button className="btn" onClick={() => onOpenLogin && onOpenLogin()}>Login</button>
          </>
        ) : (
          <>
            {/* show id and small location if available */}
            <div className="user">{displayName}{locationLabel ? ` • ${locationLabel}` : ''}</div>
            <button className="btn-ghost" onClick={() => onSignOut && onSignOut()}>Sign out</button>
          </>
        )}
      </div>
    </header>
  )
}
