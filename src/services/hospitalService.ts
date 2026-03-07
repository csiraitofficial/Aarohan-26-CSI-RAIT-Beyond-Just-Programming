/**
 * Hospital discovery via Overpass API (OpenStreetMap).
 * 100 % free — no API key, no billing.
 */

export interface Hospital {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;          // km — computed after fetch
  phone?: string;
  openingHours?: string;
  emergencyService?: boolean;
  address?: string;
  type?: string;             // hospital | clinic | doctors
}

/* ── Haversine (km) ── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Overpass query builder ── */
function buildQuery(lat: number, lon: number, radiusMeters: number): string {
  return `
[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  node["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  way["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
);
out center body;
`.trim();
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/* ── Simple in-memory cache ── */
let _cache: { key: string; data: Hospital[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(lat: number, lon: number, r: number) {
  return `${lat.toFixed(3)}_${lon.toFixed(3)}_${r}`;
}

/**
 * Fetch hospitals & clinics within `radiusKm` of the given coordinate.
 * Returns sorted by distance (closest first).
 * Uses a 5-minute cache + 8-second fetch timeout.
 */
export async function fetchNearbyHospitals(
  lat: number,
  lon: number,
  radiusKm: number = 5,
): Promise<Hospital[]> {
  const key = cacheKey(lat, lon, radiusKm);
  if (_cache && _cache.key === key && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.data;
  }

  const query = buildQuery(lat, lon, radiusKm * 1000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const json = await response.json();

  const hospitals: Hospital[] = (json.elements ?? [])
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;

      const tags = el.tags ?? {};
      return {
        id: el.id,
        name: tags.name || tags['name:en'] || 'Hospital',
        lat: elLat,
        lon: elLon,
        distance: haversine(lat, lon, elLat, elLon),
        phone: tags.phone || tags['contact:phone'],
        openingHours: tags.opening_hours,
        emergencyService: tags.emergency === 'yes',
        address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
        type: tags.amenity ?? 'hospital',
      } as Hospital;
    })
    .filter(Boolean)
    .sort((a: Hospital, b: Hospital) => a.distance - b.distance);

  _cache = { key, data: hospitals, ts: Date.now() };
  return hospitals;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if coordinate is within `radiusKm` of a hospital.
 * Foreground geofence check — works in Expo Go.
 */
export function isInsideHospitalZone(
  userLat: number,
  userLon: number,
  hospital: Hospital,
  radiusKm: number = 0.5,
): boolean {
  return haversine(userLat, userLon, hospital.lat, hospital.lon) <= radiusKm;
}
