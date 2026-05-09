import { useAuth } from '../context/AuthContext'
import { usePusher } from '../context/PusherContext'
import FleetMap from '../components/map/FleetMap'
import DirectiveInbox from '../components/directives/DirectiveInbox'
import DistressPanel from '../components/distress/DistressPanel'

function NavLogo() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[#58A6FF]/12 border border-[#58A6FF]/25 flex items-center justify-center text-[#58A6FF]">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </div>
  )
}

function FuelBar({ pct }) {
  const color = pct > 30 ? '#2EA043' : pct > 10 ? '#E3B341' : '#F85149'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">Fuel</span>
        <span className="font-mono text-[11px] font-semibold" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-[#21262D] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, pct)}%`, background: color }}
        />
      </div>
    </div>
  )
}

const STATUS_LABELS = {
  normal:            { text: 'Normal',           color: '#2EA043' },
  rerouting:         { text: 'Rerouting',         color: '#E3B341' },
  distressed:        { text: 'Distressed',        color: '#F85149' },
  stopped:           { text: 'Stopped',           color: '#8B949E' },
  stranded:          { text: 'Stranded',          color: '#F85149' },
  arrived:           { text: 'Arrived',           color: '#58A6FF' },
  insufficient_fuel: { text: 'Low Fuel',          color: '#E3B341' },
}

function ShipStatusPanel({ ship }) {
  if (!ship) {
    return (
      <div className="shrink-0 px-4 py-3 flex flex-col gap-1 text-[#484F58]">
        <span className="text-[11px]">Awaiting ship data…</span>
      </div>
    )
  }

  const fuelPct = ship.fuelCapacity > 0 ? (ship.fuelRemaining / ship.fuelCapacity) * 100 : 0
  const status  = STATUS_LABELS[ship.status] || { text: ship.status, color: '#8B949E' }

  return (
    <div className="shrink-0 px-4 pt-3 pb-4 flex flex-col gap-3">
      {/* Ship name + status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#F0F6FC]">{ship.name}</p>
          <p className="font-mono text-[10px] text-[#484F58]">{ship.cargo}</p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md border"
          style={{
            color: status.color,
            background: `${status.color}18`,
            borderColor: `${status.color}30`,
          }}
        >
          {status.text}
        </span>
      </div>

      {/* Fuel bar */}
      <FuelBar pct={fuelPct} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          { label: 'Speed',   value: `${ship.speed} kn` },
          { label: 'Heading', value: `${ship.heading}°` },
          { label: 'Dest',    value: ship.destination?.name || '—' },
          { label: 'Weather', value: ship.inAdverseWeather ? 'Adverse' : 'Clear' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-[#484F58] uppercase tracking-[0.06em]">{label}</p>
            <p className={`font-mono text-[11px] font-semibold ${
              label === 'Weather' && ship.inAdverseWeather ? 'text-[#E3B341]' : 'text-[#F0F6FC]'
            }`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Position */}
      <p className="font-mono text-[10px] text-[#484F58]">
        {ship.position.lat.toFixed(4)}°N&nbsp;&nbsp;{ship.position.lng.toFixed(4)}°E
      </p>
    </div>
  )
}

export default function CaptainDashboard() {
  const { user, logout }               = useAuth()
  const { fleet, zones, loading }      = usePusher()

  const myShip = fleet.find(s => String(s._id) === String(user?.assignedShipId))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0E14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8B949E] text-sm font-medium tracking-wide">Loading fleet data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0E14] overflow-hidden">

      {/* Nav */}
      <nav className="shrink-0 h-13 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-3">
          <NavLogo />
          <span className="text-[13px] font-bold text-[#F0F6FC] tracking-[0.06em] uppercase">
            {myShip ? myShip.name : 'Fleet Command'}
          </span>
          <div className="w-px h-4 bg-[#30363D]" />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2EA043] bg-[#2EA043]/10 border border-[#2EA043]/20 px-2.5 py-1 rounded-md uppercase tracking-[0.06em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EA043] animate-pulse" />
            Live
          </span>
          <span className="text-[11px] font-semibold text-[#58A6FF] bg-[#58A6FF]/10 border border-[#58A6FF]/20 px-2.5 py-1 rounded-md uppercase tracking-[0.06em]">
            Captain
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-md bg-[#58A6FF]/15 border border-[#58A6FF]/20 flex items-center justify-center text-[11px] font-bold text-[#58A6FF]">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="text-xs text-[#8B949E]">{user?.firstName} {user?.lastName}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8B949E] border border-[#30363D] hover:bg-[#1C2333] hover:text-[#F0F6FC] transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <FleetMap
            fleet={fleet}
            zones={zones}
            userRole="captain"
            onShipClick={null}
            onZoneDrawn={null}
          />
          {myShip && (
            <div className="absolute top-3 left-3 z-1000 flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-[#161B22]/90 border border-[#30363D] text-[#58A6FF] backdrop-blur-sm pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] animate-pulse" />
              {myShip.position.lat.toFixed(3)}°N &nbsp; {myShip.position.lng.toFixed(3)}°E
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-90 shrink-0 flex flex-col border-l border-[#30363D] bg-[#161B22] overflow-hidden">

          {/* My Ship Status */}
          <div className="shrink-0 border-b border-[#30363D]">
            <div className="px-4 h-[42px] flex items-center border-b border-[#21262D]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">
                My Ship
              </span>
            </div>
            <ShipStatusPanel ship={myShip} />
          </div>

          {/* Directive Inbox */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
            <DirectiveInbox ship={myShip} />
          </div>

          <div className="h-px bg-[#30363D] shrink-0" />

          {/* Distress Panel */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
            <DistressPanel ship={myShip} />
          </div>

        </div>
      </div>
    </div>
  )
}
