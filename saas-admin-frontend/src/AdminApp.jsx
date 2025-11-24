// src/AdminApp.jsx
import React, { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import AdminTable from './components/AdminTable'
import ReturnDetail from './components/ReturnDetail'
import './App.css'
import Login from './components/Login'
import CarbonDashboard from './components/CarbonDashboard'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

export default function AdminApp(){
  const [page, setPage] = useState('returns') // 'returns' | 'dashboard' | 'settings'
  const [returnsList, setReturnsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('admin_api_key') || '')
  const [loggedIn, setLoggedIn] = useState(Boolean(apiKey))
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (loggedIn) fetchReturns()
  }, [loggedIn])

  async function fetchReturns(){
    setLoading(true)
    try {
      const headers = apiKey ? { 'x-api-key': apiKey } : {}
      const res = await fetch(`${API}/api/returns`, { headers })
      if (!res.ok) throw new Error('fetch failed: ' + res.status)
      const json = await res.json()
      setReturnsList(json)
    } catch(err){
      console.error(err)
      alert('Could not fetch returns: ' + err.message)
    } finally { setLoading(false) }
  }

  function onLoginSuccess(key){
    setApiKey(key)
    localStorage.setItem('admin_api_key', key)
    setLoggedIn(true)
    fetchReturns()
  }

  async function onLogout(){
    localStorage.removeItem('admin_api_key')
    setApiKey('')
    setLoggedIn(false)
    setReturnsList([])
    setSelectedReturn(null)
  }

  async function onReRun(r){
    if (!apiKey) return alert('Not authenticated')
    setActionLoading(true)
    try {
      const res = await fetch(`${API}/api/returns/${r.id}/run`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `status ${res.status}`)
      }
      const json = await res.json()
      setReturnsList(prev => prev.map(x => x.id === json.doc.id ? json.doc : x))
      if (selectedReturn && selectedReturn.id === json.doc.id) setSelectedReturn(json.doc)
      alert('Re-run completed')
    } catch (err) {
      console.error('Re-run failed', err)
      alert('Re-run ML failed: ' + (err.message || err))
    } finally {
      setActionLoading(false)
    }
  }

  // accept suggested disposition (save as actualDisposition)
async function onAccept(r){
  if (!apiKey) return alert('Not authenticated')
  setActionLoading(true)
  try {
    const updated = { ...r, actualDisposition: r.suggestedDisposition }
    const res = await fetch(`${API}/api/returns/${r.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(updated)
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || `status ${res.status}`)
    }
    const json = await res.json()
    // Remove the accepted return from the visible list
    setReturnsList(prev => prev.filter(x => x.id !== json.doc.id))

    // If the detail panel was open for this item, close it
    if (selectedReturn && selectedReturn.id === json.doc.id) setSelectedReturn(null)

    // small success feedback
    alert('Disposition accepted and item removed from the active list.')
  } catch (err) {
    console.error('Accept failed', err)
    alert('Accept failed: ' + (err.message || err))
  } finally {
    setActionLoading(false)
  }
}


  function openDetail(doc){
    setSelectedReturn(doc)
  }

  function closeDetail(){
    setSelectedReturn(null)
  }

  // not logged in -> show login only (keeps NavBar)
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar title="SaaS Admin" onNavigate={setPage} currentPage={page} />
        <main className="max-w-4xl mx-auto p-6">
          <Login onLogin={onLoginSuccess} />
        </main>
      </div>
    )
  }

  // Main logged-in UI with page switching
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar title="SaaS Admin" user="Admin" onNavigate={setPage} currentPage={page} onSignOut={onLogout} />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{page === 'returns' ? 'Returns' : page === 'dashboard' ? 'Carbon Dashboard' : 'Settings'}</h2>
          <div className="flex items-center gap-3">
            {page === 'returns' && <button className="btn" onClick={fetchReturns} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>}
            <div className="text-sm text-slate-500">Total returns: {returnsList.length}</div>
          </div>
        </div>

        {page === 'returns' && (
          <>
            {loading ? (
              <div className="p-6 bg-white rounded shadow-sm">Loading returns...</div>
            ) : (
              <AdminTable
                returnsList={returnsList}
                onReRun={(r) => onReRun(r)}
                onAccept={(r) => onAccept(r)}
                onOpen={(r) => openDetail(r)}
              />
            )}

            {selectedReturn ? (
              <ReturnDetail doc={selectedReturn} onClose={closeDetail} />
            ) : null}
          </>
        )}

        {page === 'dashboard' && (
          <div className="panel bg-white p-4 rounded-md shadow-sm">
            <CarbonDashboard apiKey={apiKey} returnsList={returnsList} fetchReturns={fetchReturns}/>
          </div>
        )}

        {page === 'settings' && (
          <div className="panel bg-white p-4 rounded-md shadow-sm">
            <h3>Settings & Utilities</h3>
            <p>Admin API key: <strong>{apiKey ? '●●●●●●' : 'not set'}</strong></p>
            <div style={{marginTop:12}}>
              <button className="btn danger" onClick={() => {
                if (!confirm('Clear in-memory returns in SaaS server? This will call the dev delete endpoint.')) return
                fetch(`${API}/dev/clear-returns`, {
                  method: 'DELETE',
                  headers: { 'x-api-key': apiKey }
                }).then(r=>r.json()).then(j=>{ alert(JSON.stringify(j)); fetchReturns() }).catch(e=>alert('Failed: '+e.message))
              }}>Clear all returns (dev)</button>
            </div>
          </div>
        )}
      </main>

      {actionLoading && <div className="fixed right-4 bottom-4 p-3 bg-slate-800 text-white rounded-md shadow">Working…</div>}
    </div>
  )
}
