// server.js
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { computeCarbonSaved } from '../saas-backend/utils/carbon.js'

dotenv.config()

// --- Environment variables ---
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev_admin_key'
const ALLOWED_ADMIN_ORIGINS = (process.env.ALLOWED_ADMIN_ORIGINS || '').split(',')
const ML_URL = process.env.ML_URL || 'http://127.0.0.1:5000/predict'
const PORT = process.env.PORT || 4000
export const ADMIN_LOCATION = { lat: 22.7196, lon: 75.8577 } // Indore

// --- Express app setup ---
const app = express()
app.use(express.json())

// --- CORS setup ---
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // allow curl / server-to-server
    const allowed = new Set([
      'http://localhost:5173', // ecommerce app
      'http://localhost:5174', // admin app
      ...ALLOWED_ADMIN_ORIGINS
    ])
    if (allowed.has(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  }
}
app.use(cors(corsOptions))

// --- In-memory store (for development) ---
const RETURNS = new Map()

// --- API-key middleware (protects admin routes) ---
function requireAdminKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key
  if (!key || key !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// --- Helper: call ML Flask API ---
async function callMlForReturn(returnDoc) {
  try {
    const payload = { ...returnDoc }
    const res = await fetch(ML_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const txt = await res.text()
      return { ok: false, error: txt }
    }
    const json = await res.json()
    const result = Array.isArray(json) ? json[0] : json
    return {
      ok: true,
      recommendation: {
        recommendedDisposition: result.recommendedDisposition || result.disposition || null,
        confidence: result.confidence ?? result.confidence_score ?? null,
        probabilities: result.probabilities ?? result.probs ?? null
      }
    }
  } catch (err) {
    console.warn('ML call failed:', err?.message ?? err)
    return { ok: false, error: err?.message ?? String(err) }
  }
}

// --- Public routes (used by ecommerce app) ---

// POST: user initiates a return
app.post('/api/returns', async (req, res) => {
  const body = req.body
  if (!body || !body.orderId) return res.status(400).json({ error: 'invalid return doc; orderId required' })

  const id = body.id || `ret_${Date.now()}_${Math.floor(Math.random() * 999)}`
  const now = new Date().toISOString()
  const doc = {
    id,
    createdAt: now,
    updatedAt: now,
    sentToSaasAt: now,
    ...body,
    suggestedDisposition: null,
    suggestionConfidence: null,
    suggestionProbs: null,
    actualDisposition: body.actualDisposition ?? null
  }

  // Save immediately (so GET shows the record while we call ML)
  RETURNS.set(id, doc)

  // Ask ML for a suggestion (async call, but we await so the client sees suggestion on response)
  const mlResp = await callMlForReturn(doc)
  if (mlResp.ok) {
    const rec = mlResp.recommendation
    doc.suggestedDisposition = rec.recommendedDisposition
    doc.suggestionConfidence = rec.confidence
    doc.suggestionProbs = rec.probabilities
    doc.updatedAt = new Date().toISOString()
    RETURNS.set(id, doc)
  } else {
    doc.mlError = mlResp.error
    RETURNS.set(id, doc)
  }

  // Try compute an estimated carbon (non-confirmed). Use computeCarbonSaved; failures are non-blocking.
  try {
    const { carbon_saved_kg, carbon_breakdown, carbon_computed_at } = computeCarbonSaved(doc)
    doc.carbon_saved_kg = carbon_saved_kg
    doc.carbon_breakdown = carbon_breakdown
    doc.carbon_computed_at = carbon_computed_at
    doc.carbon_confirmed = false // this is an estimate until admin accepts
    RETURNS.set(id, doc)
  } catch (err) {
    console.warn('carbon estimate compute failed on create:', err?.message ?? err)
    doc.carbon_error = String(err?.message ?? err)
    RETURNS.set(id, doc)
  }

  return res.status(201).json({ success: true, id, doc })
})

// GET: all returns (optional protection)
app.get('/api/returns', (req, res) => {
  const list = Array.from(RETURNS.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
  res.json(list)
})

// GET: single return
app.get('/api/returns/:id', (req, res) => {
  const doc = RETURNS.get(req.params.id)
  if (!doc) return res.status(404).json({ error: 'not found' })
  res.json(doc)
})

// --- Admin-only routes ---

// PUT: admin updates disposition or any field
app.put('/api/returns/:id', requireAdminKey, (req, res) => {
  const id = req.params.id
  const doc = RETURNS.get(id)
  if (!doc) return res.status(404).json({ error: 'not found' })

  const updated = { ...doc, ...req.body, updatedAt: new Date().toISOString() }

  // If admin sets actualDisposition we compute confirmed carbon
  if (updated.actualDisposition) {
    try {
      const { carbon_saved_kg, carbon_breakdown, carbon_computed_at } = computeCarbonSaved(updated)
      updated.carbon_saved_kg = carbon_saved_kg
      updated.carbon_breakdown = carbon_breakdown
      updated.carbon_computed_at = carbon_computed_at
      updated.carbon_confirmed = true
      delete updated.carbon_error
    } catch (err) {
      console.warn('carbon compute failed', err?.message ?? err)
      updated.carbon_error = String(err?.message ?? err)
      updated.carbon_confirmed = false
    }
  } else {
    // if admin removed actualDisposition or it's not set, mark unconfirmed
    updated.carbon_confirmed = false
  }

  RETURNS.set(id, updated)
  res.json({ success: true, doc: updated })
})

// POST: admin re-runs ML for a given return
app.post('/api/returns/:id/run', requireAdminKey, async (req, res) => {
  const id = req.params.id
  const doc = RETURNS.get(id)
  if (!doc) return res.status(404).json({ error: 'not found' })

  const mlResp = await callMlForReturn(doc)
  if (mlResp.ok) {
    const rec = mlResp.recommendation
    doc.suggestedDisposition = rec.recommendedDisposition
    doc.suggestionConfidence = rec.confidence
    doc.suggestionProbs = rec.probabilities
    doc.updatedAt = new Date().toISOString()
    // recompute estimate (do not mark confirmed unless admin accepts)
    try {
      const { carbon_saved_kg, carbon_breakdown, carbon_computed_at } = computeCarbonSaved(doc)
      doc.carbon_saved_kg = carbon_saved_kg
      doc.carbon_breakdown = carbon_breakdown
      doc.carbon_computed_at = carbon_computed_at
      // keep carbon_confirmed unchanged (if it was true it remains true; otherwise false)
      doc.carbon_confirmed = doc.carbon_confirmed === true ? true : false
    } catch (err) {
      doc.carbon_error = String(err?.message ?? err)
    }

    RETURNS.set(id, doc)
    return res.json({ success: true, doc })
  } else {
    return res.status(500).json({ success: false, error: mlResp.error })
  }
})

// --- Health check ---
app.get('/health', (req, res) => res.json({ ok: true, ml_url: ML_URL }))

// GET /api/metrics/carbon?start=2025-01-01&end=2025-12-31
app.get('/api/metrics/carbon', requireAdminKey, (req, res) => {
  try {
    const { start, end } = req.query
    const rows = Array.from(RETURNS.values())

    const filtered = rows.filter(r => {
      if (!start && !end) return true
      const t = new Date(r.carbon_computed_at || r.updatedAt || r.createdAt)
      if (start && t < new Date(start)) return false
      if (end && t > new Date(end)) return false
      return true
    })

    const confirmed = filtered.filter(r => r.carbon_confirmed === true)
    const estimated = filtered.filter(r => r.carbon_confirmed !== true)

    const sum = (arr) => arr.reduce((s, r) => s + Number(r.carbon_saved_kg || 0), 0)

    const totalConfirmed = sum(confirmed)
    const totalEstimated = sum(estimated)

    const byDisposition = {}
    const byCategory = {}
    confirmed.forEach(r => {
      const d = (r.actualDisposition || r.actual_disposition || 'unknown').toString()
      const c = (r.product_category || r.productCategory || 'unknown').toString()
      const val = Number(r.carbon_saved_kg || 0)
      byDisposition[d] = (byDisposition[d] || 0) + val
      byCategory[c] = (byCategory[c] || 0) + val
    })

    res.json({
      ok: true,
      totalConfirmedKg: Number(totalConfirmed.toFixed(4)),
      totalEstimatedKg: Number(totalEstimated.toFixed(4)),
      byDisposition,
      byCategory,
      countConfirmed: confirmed.length,
      countEstimated: estimated.length
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// --- Start server ---
app.listen(PORT, () =>
  console.log(`✅ SaaS backend running on http://localhost:${PORT}`)
)
