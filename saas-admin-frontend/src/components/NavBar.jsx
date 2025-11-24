// src/components/NavBar.jsx
import React from 'react'

export default function NavBar({ title = 'SaaS Admin', user, onSignOut, onNavigate, currentPage }) {
  const navClass = (p) => p === currentPage ? 'nav-btn active' : 'nav-btn'

  return (
    <header className="topbar admin-topbar">
      <div className="left">
        <div className="brand">SA</div>
        <div className="title-block">
          <div className="title">{title}</div>
          <div className="subtitle">Admin panel</div>
        </div>
      </div>

      <nav className="nav" role="navigation" aria-label="Admin">
        <button className={navClass('returns')} onClick={() => onNavigate('returns')}>Returns</button>
        <button className={navClass('dashboard')} onClick={() => onNavigate('dashboard')}>Carbon Dashboard</button>
        <button className={navClass('settings')} onClick={() => onNavigate('settings')}>Settings</button>
      </nav>

      <div className="right">
        <div className="user">{user ?? 'Admin'}</div>
        {user ? <button className="btn-ghost" onClick={onSignOut}>Sign out</button> : null}
      </div>
    </header>
  )
}
