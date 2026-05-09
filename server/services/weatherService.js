import axios from 'axios'

// Adverse weather thresholds (documented assumptions)
const WIND_THRESHOLD_MS   = 15    // m/s — Beaufort 7+
const WAVE_THRESHOLD_M    = 2.5   // m — significant wave height
const PRECIP_THRESHOLD_MM = 5     // mm/hr

// Cache: key = "lat_lng" at 0.5° resolution, value = { adverse: bool, expiresAt: ms }
const weatherCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

function cacheKey(lat, lng) {
  const roundedLat = Math.round(lat / 0.5) * 0.5
  const roundedLng = Math.round(lng / 0.5) * 0.5
  return `${roundedLat}_${roundedLng}`
}

async function fetchWeather(lat, lng) {
  const baseUrl = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1/forecast'
  const url = `${baseUrl}?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wave_height,precipitation&forecast_days=1`

  const { data } = await axios.get(url, { timeout: 5000 })

  // Use the first available hour's data
  const wind  = data.hourly?.wind_speed_10m?.[0]  ?? 0
  const wave  = data.hourly?.wave_height?.[0]      ?? 0
  const precip = data.hourly?.precipitation?.[0]   ?? 0

  return wind > WIND_THRESHOLD_MS || wave > WAVE_THRESHOLD_M || precip > PRECIP_THRESHOLD_MM
}

export async function isAdverseWeather(lat, lng) {
  const key = cacheKey(lat, lng)
  const cached = weatherCache.get(key)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.adverse
  }

  try {
    const adverse = await fetchWeather(lat, lng)
    weatherCache.set(key, { adverse, expiresAt: Date.now() + CACHE_TTL_MS })
    return adverse
  } catch {
    // If weather API fails, return false (don't penalize ships on API error)
    return false
  }
}
