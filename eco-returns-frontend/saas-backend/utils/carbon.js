// saas-backend/utils/carbon.js
// computeCarbonSaved(returnDoc, opts) -> { carbon_saved_kg, carbon_breakdown, carbon_computed_at }
//
// Conservative, auditable estimate based on product weight, category and transport distance.
// Tweak DEFAULTS below if you want different coefficients.

export function computeCarbonSaved(returnDoc = {}, opts = {}) {
  const {
    weight_kg: rawWeight,
    product_category,
    distance_km: rawDistance,
    actualDisposition,
    suggestedDisposition
  } = returnDoc || {}

  // --- Defaults & config (tuneable) ---
  const DEFAULTS = {
    default_weight_kg: opts.default_weight_kg ?? 0.5, // fallback product weight (kg)
    default_distance_km: opts.default_distance_km ?? 50, // fallback distance (km)
    transport_factor_per_kg_km: opts.transport_factor_per_kg_km ?? 0.0002, // kgCO2e per (kg * km)
    refurbish_emissions_per_item: opts.refurbish_emissions_per_item ?? 1.0, // kgCO2e per refurb
    processing_cost_per_item: opts.processing_cost_per_item ?? 0.2, // kgCO2e handling
    // embodied emissions per kg by category (kgCO2e per kg)
    embodied_per_kg_map: opts.embodied_per_kg_map ?? {
      electronics: 80,   // electronics manufacturing heavy — tune this carefully
      clothing: 15,
      book: 5,
      accessory: 10,
      home: 20,
      default: 20
    },
    // salvage (avoided new production) fraction by disposition
    salvage_rate_by_disposition: opts.salvage_rate_by_disposition ?? {
      resell: 0.8,
      refurbish: 0.5,
      recycle: 0.2,
      donate: 0.3,
      returnless: 0.0,
      default: 0.2
    }
  }

  // --- sanitize and resolve inputs ---
  const weight_kg = Number(rawWeight ?? DEFAULTS.default_weight_kg)
  const distance_km = Number(rawDistance ?? DEFAULTS.default_distance_km)
  const category = (product_category || 'default').toString()
  const embodied_per_kg = Number(DEFAULTS.embodied_per_kg_map[category] ?? DEFAULTS.embodied_per_kg_map.default)

  const disposition = (String(actualDisposition || suggestedDisposition || 'resell')).toLowerCase()
  const salvage_rate = Number(DEFAULTS.salvage_rate_by_disposition[disposition] ?? DEFAULTS.salvage_rate_by_disposition.default)

  // --- component calculations ---
  const embodied_total = weight_kg * embodied_per_kg // kgCO2e embodied
  const avoided_new_production = embodied_total * salvage_rate
  const avoided_transport = weight_kg * distance_km * DEFAULTS.transport_factor_per_kg_km
  const refurbish_emissions = disposition === 'refurbish' ? DEFAULTS.refurbish_emissions_per_item : 0
  const processing_costs = DEFAULTS.processing_cost_per_item

  // conservative final number
  const raw_saved = avoided_new_production + avoided_transport - refurbish_emissions - processing_costs
  const carbon_saved_kg = Number(Math.max(0, raw_saved).toFixed(3))

  const breakdown = {
    weight_kg: Number(weight_kg.toFixed(3)),
    product_category: category,
    embodied_per_kg: Number(embodied_per_kg),
    embodied_total: Number(embodied_total.toFixed(3)),
    salvage_rate: Number(salvage_rate),
    avoided_new_production: Number(avoided_new_production.toFixed(3)),
    distance_km: Number(distance_km.toFixed(3)),
    avoided_transport: Number(avoided_transport.toFixed(3)),
    refurbish_emissions: Number(refurbish_emissions.toFixed(3)),
    processing_costs: Number(processing_costs.toFixed(3)),
    carbon_saved_kg
  }

  return { carbon_saved_kg, carbon_breakdown: breakdown, carbon_computed_at: new Date().toISOString() }
}
