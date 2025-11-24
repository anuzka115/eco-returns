import React, { useState } from 'react'
export default function Login({ onSuccess }){
  const [key, setKey] = useState('')
  function submit(e){ e.preventDefault(); if(!key) return alert('enter key'); onSuccess(key) }
  return (
    <div className="panel">
      <h2>Admin Sign in</h2>
      <form onSubmit={submit}>
        <label>API Key
          <input value={key} onChange={e=>setKey(e.target.value)} placeholder="enter admin api key" />
        </label>
        <div style={{marginTop:8}}>
          <button className="btn" type="submit">Sign in</button>
        </div>
      </form>
      <div className="muted" style={{marginTop:8}}>Use the ADMIN_API_KEY set on the backend for local demo.</div>
    </div>
  )
}
