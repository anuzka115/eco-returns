// src/api.js (replace or extend your existing file)
const SAAS_URL = 'http://127.0.0.1:4000/api/returns' // change to your SaaS endpoint

export async function sendReturnToSaaS(returnDoc) {
  try {
    const res = await fetch(SAAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnDoc)
    })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, status: res.status, error: text }
    }
    const body = await res.json()
    return { success: true, body }
  } catch (err) {
    console.warn('sendReturnToSaaS failed:', err.message)
    return { success: false, error: err.message }
  }
}
// Add this at bottom of api.js

export async function getDispositionRecommendation(row) {
  console.warn('ML integration disabled in ecommerce mode; returning dummy response.');
  return { disposition: 'pending', confidence: 0.0, probs: null };
}


// keep previous helpers if you have them (callMLService, localHeuristic) — not necessary here
