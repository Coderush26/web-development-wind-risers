import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const PORTS = [
  { id: 'KWT-1', name: 'Kuwait City',  lat: 29.48, lng: 48.34 },
  { id: 'BUS-1', name: 'Bushehr',      lat: 28.83, lng: 50.73 },
  { id: 'DMM-1', name: 'Dammam',       lat: 26.56, lng: 50.30 },
  { id: 'BAH-1', name: 'Manama',       lat: 26.50, lng: 50.55 },
  { id: 'DOH-1', name: 'Doha',         lat: 25.46, lng: 51.95 },
  { id: 'AUH-1', name: 'Abu Dhabi',    lat: 25.22, lng: 54.18 },
  { id: 'DXB-1', name: 'Jebel Ali',    lat: 25.50, lng: 54.75 },
  { id: 'BND-1', name: 'Bandar Abbas', lat: 26.62, lng: 56.11 },
  { id: 'SOH-1', name: 'Sohar',        lat: 24.72, lng: 57.02 },
  { id: 'MCT-1', name: 'Muscat',       lat: 23.92, lng: 58.58 },
]

const TYPE_LABELS = {
  reroute:          'Reroute to Port',
  divert_waypoint:  'Divert via Waypoint',
  hold_position:    'Hold Position',
}

export default function DirectiveComposer({ ship, onBack, onSent }) {
  const [type,    setType]    = useState('reroute')
  const [portId,  setPortId]  = useState(PORTS[0].id)
  const [wpLat,   setWpLat]   = useState('')
  const [wpLng,   setWpLng]   = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    try {
      let payload = {}

      if (type === 'reroute') {
        const port = PORTS.find(p => p.id === portId)
        payload = { newDestination: { id: port.id, name: port.name, lat: port.lat, lng: port.lng } }
      } else if (type === 'divert_waypoint') {
        const lat = parseFloat(wpLat)
        const lng = parseFloat(wpLng)
        if (isNaN(lat) || isNaN(lng)) {
          toast.error('Enter valid coordinates')
          setSending(false)
          return
        }
        payload = { waypoint: { lat, lng } }
      }

      await api.post('/directives', { toShipId: ship._id, type, payload })
      toast.success(`Directive sent to ${ship.name}`)
      onSent?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send directive')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full bg-[#0B0E14] border border-[#30363D] rounded-lg px-3 py-2 text-[13px] text-[#F0F6FC] outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]/20 transition-all font-mono placeholder:text-[#484F58]'
  const selectCls = `${inputCls} cursor-pointer`

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[42px] border-b border-[#30363D] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-6 h-6 flex items-center justify-center rounded text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#1C2333] transition-all"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">
            Issue Directive
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#58A6FF]">{ship.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">Directive Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className={selectCls}>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val} style={{ background: '#161B22' }}>{label}</option>
            ))}
          </select>
        </div>

        {/* Payload fields */}
        {type === 'reroute' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">Destination Port</label>
            <select value={portId} onChange={e => setPortId(e.target.value)} className={selectCls}>
              {PORTS.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#161B22' }}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {type === 'divert_waypoint' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">Waypoint Coordinates</label>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" placeholder="Latitude"
                value={wpLat} onChange={e => setWpLat(e.target.value)}
                className={inputCls}
              />
              <input
                type="number" step="0.01" placeholder="Longitude"
                value={wpLng} onChange={e => setWpLng(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {type === 'hold_position' && (
          <div className="flex items-center gap-2.5 bg-[#E3B341]/08 border border-[#E3B341]/20 rounded-lg p-3">
            <svg width="14" height="14" fill="none" stroke="#E3B341" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-[11px] text-[#E3B341]">
              Ship will stop at current position until further directive.
            </p>
          </div>
        )}

        {/* Summary card */}
        <div className="bg-[#0B0E14] border border-[#21262D] rounded-lg p-3 flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">Summary</p>
          <p className="text-[12px] text-[#F0F6FC]">
            {type === 'reroute'         && `Reroute ${ship.name} to ${PORTS.find(p=>p.id===portId)?.name}`}
            {type === 'divert_waypoint' && `Divert ${ship.name} via waypoint (${wpLat||'?'}, ${wpLng||'?'})`}
            {type === 'hold_position'   && `Order ${ship.name} to hold current position`}
          </p>
        </div>

        <button
          onClick={send}
          disabled={sending}
          className="w-full py-2.5 rounded-lg text-[13px] font-semibold bg-[#58A6FF] text-[#0B0E14] hover:bg-[#79B8FF] active:bg-[#388BFD] transition-colors disabled:opacity-40 tracking-wide mt-auto"
        >
          {sending ? 'Sending…' : 'Send Directive'}
        </button>
      </div>
    </div>
  )
}
