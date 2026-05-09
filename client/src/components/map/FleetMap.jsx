import { useEffect, useRef, useCallback, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet'
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

// ── Zone drawing — custom control, no leaflet-draw dependency ─────────────
function DrawController({ onZoneDrawn }) {
  const map            = useMap()
  const stableCallback = useCallback(onZoneDrawn, []) // eslint-disable-line

  useEffect(() => {
    if (!map) return

    const BTN = 'background:transparent;border:none;padding:6px 14px;border-radius:6px;' +
                'cursor:pointer;font-size:12px;font-weight:600;width:100%;text-align:left;' +
                'white-space:nowrap;letter-spacing:0.04em;'

    let drawing = false
    let points  = []
    let markers = []
    let preview = null
    let drawBtn, finishBtn, undoBtn, cancelBtn

    function startDrawing() {
      drawing = true
      points  = []
      drawBtn.style.display   = 'none'
      finishBtn.style.display = 'block'
      undoBtn.style.display   = 'block'
      cancelBtn.style.display = 'block'
      updateButtons()
      map.getContainer().style.cursor = 'crosshair'
    }

    function finishDrawing() {
      if (points.length < 3) return
      const latlngs = points.map(p => [p.lat, p.lng])
      cleanup()
      stableCallback(latlngs)
    }

    function undoLast() {
      if (!points.length) return
      points.pop()
      const last = markers.pop()
      if (last) last.remove()
      redrawPreview()
      updateButtons()
    }

    function cleanup() {
      drawing = false
      points  = []
      markers.forEach(m => m.remove())
      markers = []
      if (preview) { preview.remove(); preview = null }
      if (drawBtn)   drawBtn.style.display   = 'block'
      if (finishBtn) finishBtn.style.display  = 'none'
      if (undoBtn)   undoBtn.style.display    = 'none'
      if (cancelBtn) cancelBtn.style.display  = 'none'
      map.getContainer().style.cursor = ''
    }

    function updateButtons() {
      const ok = points.length >= 3
      if (finishBtn) {
        finishBtn.style.opacity = ok ? '1' : '0.35'
        finishBtn.disabled      = !ok
      }
      if (undoBtn) {
        undoBtn.style.opacity = points.length > 0 ? '1' : '0.35'
        undoBtn.disabled      = points.length === 0
      }
    }

    function redrawPreview() {
      if (preview) { preview.remove(); preview = null }
      if (points.length > 1) {
        preview = L.polyline([...points, points[0]], {
          color: '#F85149', weight: 1.5, dashArray: '6 4', opacity: 0.9,
        }).addTo(map)
      }
    }

    function onMapClick(e) {
      if (!drawing) return
      points.push(e.latlng)
      const m = L.circleMarker(e.latlng, {
        radius: 5, color: '#F85149', fillColor: '#F85149', fillOpacity: 1, weight: 2,
      }).addTo(map)
      markers.push(m)
      redrawPreview()
      updateButtons()
    }

    const ZoneControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const div = L.DomUtil.create('div')
        div.style.cssText =
          'display:flex;flex-direction:column;gap:2px;background:#161B22;' +
          'border:1px solid #30363D;border-radius:8px;padding:4px;' +
          'box-shadow:0 4px 16px rgba(0,0,0,0.5);min-width:130px;'

        drawBtn   = L.DomUtil.create('button', '', div)
        finishBtn = L.DomUtil.create('button', '', div)
        undoBtn   = L.DomUtil.create('button', '', div)
        cancelBtn = L.DomUtil.create('button', '', div)

        drawBtn.innerHTML   = '⬡&nbsp; Draw Zone'
        finishBtn.innerHTML = '✓&nbsp; Finish'
        undoBtn.innerHTML   = '↩&nbsp; Undo'
        cancelBtn.innerHTML = '✕&nbsp; Cancel'

        drawBtn.style.cssText   = BTN + 'color:#F0F6FC;'
        finishBtn.style.cssText = BTN + 'color:#2EA043;display:none;'
        undoBtn.style.cssText   = BTN + 'color:#E3B341;display:none;'
        cancelBtn.style.cssText = BTN + 'color:#F85149;display:none;'

        L.DomEvent.disableClickPropagation(div)
        L.DomEvent.on(drawBtn,   'click', startDrawing)
        L.DomEvent.on(finishBtn, 'click', finishDrawing)
        L.DomEvent.on(undoBtn,   'click', undoLast)
        L.DomEvent.on(cancelBtn, 'click', cleanup)

        return div
      },
      onRemove() {},
    })

    const control = new ZoneControl()
    map.addControl(control)
    map.on('click', onMapClick)

    return () => {
      map.off('click', onMapClick)
      map.removeControl(control)
      cleanup()
    }
  }, [map, stableCallback])

  return null
}

// ── Clickable zone polygon with delete popup ───────────────────────────────
function ZoneLayer({ zone, userRole, onZoneDelete }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    try {
      await onZoneDelete(zone._id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Polygon
      positions={zone.polygon.map(p => [p[0], p[1]])}
      pathOptions={{
        color: '#F85149', fillColor: '#F85149',
        fillOpacity: 0.12, weight: 1.5, dashArray: '6 4',
      }}
      eventHandlers={{ mouseover: e => e.target.setStyle({ fillOpacity: 0.25 }),
                       mouseout:  e => e.target.setStyle({ fillOpacity: 0.12 }) }}
    >
      <Popup>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          background: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '10px',
          padding: '12px 14px',
          minWidth: '180px',
          color: '#F0F6FC',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{zone.name}</p>
          <span style={{
            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '2px 6px', borderRadius: '4px',
            background: 'rgba(248,81,73,0.12)', color: '#F85149',
            border: '1px solid rgba(248,81,73,0.25)', display: 'inline-block', marginBottom: '10px',
          }}>
            {zone.type}
          </span>
          {userRole === 'command' && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                width: '100%', padding: '6px 10px', borderRadius: '7px',
                background: 'rgba(248,81,73,0.12)', color: '#F85149',
                border: '1px solid rgba(248,81,73,0.25)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? 'Removing…' : 'Delete Zone'}
            </button>
          )}
        </div>
      </Popup>
    </Polygon>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export default function FleetMap({ fleet, zones, onShipClick, userRole, onZoneDrawn, onZoneDelete }) {
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
        <ZoneLayer
          key={zone._id}
          zone={zone}
          userRole={userRole}
          onZoneDelete={onZoneDelete}
        />
      ))}

      <MapController fleet={fleet} onShipClick={onShipClick} />
      {userRole === 'command' && onZoneDrawn && <DrawController onZoneDrawn={onZoneDrawn} />}
    </MapContainer>
  )
}
