// src/utils/geo.js
// returns distance in kilometers between two {lat, lon} points
export function haversineKm(a, b) {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371.0; // Earth radius km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
  return Number((R * c).toFixed(3)); // km, 3 decimals
}
