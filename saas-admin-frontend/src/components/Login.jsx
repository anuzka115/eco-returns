// src/Login.jsx
import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!userId.trim()) return alert('Enter a user id (e.g. user_001)');
    onLogin(userId.trim());
  }

  return (
    <div className="panel">
      <h2>Sign in</h2>
      <form onSubmit={submit}>
        <label>User ID
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="user_001" />
        </label>
        <div style={{marginTop:8}}>
          <button className="btn" type="submit">Sign in</button>
        </div>
      </form>
      <div style={{marginTop:8}} className="muted">This is a demo: signing in persists to localStorage only.</div>
    </div>
  );
}
