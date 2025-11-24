// src/components/Login.jsx
import React, { useState } from 'react';

export default function Login({ onLogin, defaultId = '' }) {
  const [id, setId] = useState(defaultId || '');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  function submit(e) {
    e?.preventDefault?.();
    if (!id) return alert('Enter user id');

    // parse lat/lon into numbers if present
    const location = (lat && lon)
      ? { lat: Number(lat), lon: Number(lon), city: city || null }
      : (city ? { city } : null);

    onLogin({ id, location }); // pass object instead of simple id
  }

  // convenience: quick-fill some example cities (optional)
  function fillExample(cityName) {
    const map = {
      'Mumbai': { lat: 19.0760, lon: 72.8777 },
      'New Delhi': { lat: 28.6139, lon: 77.2090 },
      'Bengaluru': { lat: 12.9716, lon: 77.5946 },
      'Indore': { lat: 22.7196, lon: 75.8577 }
    }
    const v = map[cityName];
    if (v) { setCity(cityName); setLat(String(v.lat)); setLon(String(v.lon)); }
  }

  return (
    <form onSubmit={submit} style={{display:'grid',gap:8}}>
      <label>
        User ID
        <input value={id} onChange={e => setId(e.target.value)} placeholder="e.g. user123" />
      </label>

      <label>
        City (optional)
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City name (optional)" />
      </label>

      <div style={{display:'flex',gap:8}}>
        <label style={{flex:1}}>
          Latitude (optional)
          <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="e.g. 19.0760" />
        </label>
        <label style={{flex:1}}>
          Longitude (optional)
          <input value={lon} onChange={e=>setLon(e.target.value)} placeholder="e.g. 72.8777" />
        </label>
      </div>

      <div style={{display:'flex',gap:8}}>
        <button className="btn" type="submit">Sign in</button>
        <button type="button" className="btn-ghost" onClick={() => fillExample('Mumbai')}>Fill Mumbai</button>
        <button type="button" className="btn-ghost" onClick={() => fillExample('New Delhi')}>Fill Delhi</button>
      </div>
    </form>
  );
}
