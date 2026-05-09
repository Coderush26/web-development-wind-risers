import { useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'

const STATUS_COLORS = {
  normal:            '#2EA043',
  rerouting:         '#E3B341',
  distressed:        '#F85149',
  stopped:           '#8B949E',
  stranded:          '#F85149',
  arrived:           '#58A6FF',
  insufficient_fuel: '#E3B341',
}

function shipIcon(ship) {
  const color   = STATUS_COLORS[ship.status] || '#8B949E'
  const rad     = (ship.heading * Math.PI) / 180
  const ex      = 14 + Math.sin(rad) * 9
  const ey      = 14 - Math.cos(rad) * 9
  const isPulse = ship.status === 'distressed' || ship.status === 'stranded'
  const isWarn  = ship.status === 'insufficient_fuel'

  const pulse = isPulse
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:${color};opacity:0.3;animation:marker-ring 1.4s ease-out infinite;pointer-events:none"></div>`
    : isWarn
    ? `<div style="position:absolute;inset:-3px;border-radius:50%;border:1.5px dashed ${color};opacity:0.6;pointer-events:none"></div>`
    : ''

  const html = `
    <div style="position:relative;width:28px;height:28px;">
      ${pulse}
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="10" fill="${color}" fill-opacity="0.18"/>
        <circle cx="14" cy="14" r="6"  fill="${color}"/>
        <line x1="14" y1="14" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"
              stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>`

  return L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] })
}

// ── Ship markers with smooth position interpolation ───────────────────────
const INTERP_MS = 950   // slightly under the 1 Hz tick so markers never freeze

function MapController({ fleet, onShipClick }) {
  const map        = useMap()
  const markersRef = useRef(new Map())  // id → L.Marker
  const animsRef   = useRef(new Map())  // id → { fLat, fLng, tLat, tLng, t0 }
  const rafRef     = useRef(null)

  // Continuous interpolation loop — runs independently of React renders
  useEffect(() => {
    function frame(now) {
      animsRef.current.forEach(({ fLat, fLng, tLat, tLng, t0 }, id) => {
        const marker = markersRef.current.get(id)
        if (!marker) return
        const p = Math.min((now - t0) / INTERP_MS, 1)
        marker.setLatLng([fLat + (tLat - fLat) * p, fLng + (tLng - fLng) * p])
      })
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // On each fleet snapshot: register animation targets, create/remove markers
  useEffect(() => {
    const now  = performance.now()
    const seen = new Set()

    fleet.forEach(ship => {
      seen.add(ship._id)
      const { lat, lng } = ship.position
      const icon = shipIcon(ship)

      if (markersRef.current.has(ship._id)) {
        const m   = markersRef.current.get(ship._id)
        const cur = m.getLatLng()
        // Animate from current rendered position → new server position
        animsRef.current.set(ship._id, { fLat: cur.lat, fLng: cur.lng, tLat: lat, tLng: lng, t0: now })
        m.setIcon(icon)
      } else {
        const m = L.marker([lat, lng], { icon })
          .addTo(map)
          .on('click', () => onShipClick?.(ship))
        m.bindTooltip(
          `<div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:#F0F6FC;background:#161B22;border:1px solid #30363D;padding:4px 8px;border-radius:6px;">${ship.name}</div>`,
          { permanent: false, direction: 'top', offset: [0, -12], opacity: 1, className: '' }
        )
        markersRef.current.set(ship._id, m)
        animsRef.current.set(ship._id, { fLat: lat, fLng: lng, tLat: lat, tLng: lng, t0: now })
      }
    })

    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
        animsRef.current.delete(id)
      }
    })
  }, [fleet, map, onShipClick])

  return null
}

// ── Zone drawing (command only, requires leaflet-draw CDN) ─────────────────
function DrawController({ onZoneDrawn }) {
  const map          = useMap()
  const drawnRef     = useRef(null)
  const controlRef   = useRef(null)
  const stableCallback = useCallback(onZoneDrawn, []) // eslint-disable-line

  useEffect(() => {
    if (!map || !window.L?.Control?.Draw) return

    const drawnItems = new window.L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnRef.current = drawnItems

    const drawControl = new window.L.Control.Draw({
      position: 'topright',
      edit:     { featureGroup: drawnItems, edit: false, remove: false },
      draw: {
        polygon: {
          shapeOptions: {
            color: '#F85149', fillColor: '#F85149',
            fillOpacity: 0.12, weight: 1.5, dashArray: '6 4',
          },
          showArea: false,
          guideLayers: [],
        },
        polyline: false, rectangle: false, circle: false,
        circlemarker: false, marker: false,
      },
    })

    map.addControl(drawControl)
    controlRef.current = drawControl

    const onCreate = e => {
      const latlngs = e.layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng])
      drawnItems.clearLayers()
      stableCallback(latlngs)
    }

    map.on(window.L.Draw.Event.CREATED, onCreate)

    return () => {
      map.off(window.L.Draw.Event.CREATED, onCreate)
      if (controlRef.current) map.removeControl(controlRef.current)
      if (drawnRef.current)   map.removeLayer(drawnRef.current)
    }
  }, [map, stableCallback])

  return null
}

// ── Main export ────────────────────────────────────────────────────────────
export default function FleetMap({ fleet, zones, onShipClick, userRole, onZoneDrawn }) {
  return (
    <MapContainer
      center={[26.5, 54.0]}
      zoom={6}
      minZoom={5}
      maxZoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {zones.map(zone => (
        <Polygon
          key={zone._id}
          positions={zone.polygon.map(p => [p[0], p[1]])}
          pathOptions={{
            color: '#F85149', fillColor: '#F85149',
            fillOpacity: 0.12, weight: 1.5, dashArray: '6 4',
          }}
        />
      ))}

      <MapController fleet={fleet} onShipClick={onShipClick} />
      {userRole === 'command' && onZoneDrawn && <DrawController onZoneDrawn={onZoneDrawn} />}
    </MapContainer>
  )
}
