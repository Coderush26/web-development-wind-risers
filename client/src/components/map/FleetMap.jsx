import { useEffect, useRef } from 'react'
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
  const color    = STATUS_COLORS[ship.status] || '#8B949E'
  const rad      = (ship.heading * Math.PI) / 180
  const ex       = 14 + Math.sin(rad) * 9
  const ey       = 14 - Math.cos(rad) * 9
  const isPulse  = ship.status === 'distressed' || ship.status === 'stranded'
  const isWarn   = ship.status === 'insufficient_fuel'

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

function MapController({ fleet, onShipClick }) {
  const map         = useMap()
  const markersRef  = useRef(new Map())

  useEffect(() => {
    const current = markersRef.current
    const seen    = new Set()

    fleet.forEach(ship => {
      seen.add(ship._id)
      const latlng = [ship.position.lat, ship.position.lng]
      const icon   = shipIcon(ship)

      if (current.has(ship._id)) {
        const m = current.get(ship._id)
        m.setLatLng(latlng)
        m.setIcon(icon)
      } else {
        const m = L.marker(latlng, { icon })
          .addTo(map)
          .on('click', () => onShipClick && onShipClick(ship))
        m.bindTooltip(
          `<div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:#F0F6FC;background:#161B22;border:1px solid #30363D;padding:4px 8px;border-radius:6px;">${ship.name}</div>`,
          { permanent: false, direction: 'top', offset: [0, -12], opacity: 1, className: '' }
        )
        current.set(ship._id, m)
      }
    })

    // Remove stale markers
    current.forEach((marker, id) => {
      if (!seen.has(id)) { marker.remove(); current.delete(id) }
    })
  }, [fleet, map, onShipClick])

  return null
}

export default function FleetMap({ fleet, zones, onShipClick }) {
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
            color:       '#F85149',
            fillColor:   '#F85149',
            fillOpacity: 0.12,
            weight:      1.5,
            dashArray:   '6 4',
          }}
        />
      ))}

      <MapController fleet={fleet} onShipClick={onShipClick} />
    </MapContainer>
  )
}
