import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePusher } from '../context/PusherContext'
import FleetMap from '../components/map/FleetMap'
import AlertPanel from '../components/alerts/AlertPanel'
import ShipDetailPanel from '../components/ships/ShipDetailPanel'

function NavLogo() {
  return (
    <div className="w-[28px] h-[28px] rounded-[7px] bg-[#58A6FF]/12 border border-[#58A6FF]/25 flex items-center justify-center text-[#58A6FF]">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </div>
  )
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2EA043] bg-[#2EA043]/10 border border-[#2EA043]/20 px-2.5 py-1 rounded-md uppercase tracking-[0.06em]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#2EA043] animate-pulse" />
      Live
    </span>
  )
}

function NavStat({ label, value, highlight }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md">
      <span className="text-[11px] text-[#484F58]">{label}</span>
      <span className={`font-mono text-[13px] font-semibold ${highlight ? 'text-[#F85149]' : 'text-[#F0F6FC]'}`}>
        {value}
      </span>
    </div>
  )
}

export default function CommandDashboard() {
  const { user, logout } = useAuth()
  const { fleet, alerts, zones, loading } = usePusher()
  const [selectedShip, setSelectedShip] = useState(null)

  const activeAlerts   = alerts.filter(a => a.status === 'active')
  const distressedShips = fleet.filter(s => s.status === 'distressed' || s.status === 'stranded')

  // Keep selected ship in sync with live fleet updates
  const liveSelectedShip = selectedShip
    ? fleet.find(s => s._id === selectedShip._id) || selectedShip
    : null

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

      {/* ── Navigation Bar ── */}
      <nav className="flex-shrink-0 h-[52px] bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-5 z-10">

        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <NavLogo />
          <span className="text-[13px] font-bold text-[#F0F6FC] tracking-[0.06em] uppercase">
            Fleet Command
          </span>
          <div className="w-px h-4 bg-[#30363D]" />
          <LiveDot />
        </div>

        {/* Center: stats */}
        <div className="flex items-center gap-1 bg-[#0B0E14] border border-[#21262D] rounded-lg px-1 py-1">
          <NavStat label="Ships"    value={fleet.length} />
          <div className="w-px h-4 bg-[#21262D]" />
          <NavStat label="Alerts"   value={activeAlerts.length}    highlight={activeAlerts.length > 0} />
          <div className="w-px h-4 bg-[#21262D]" />
          <NavStat label="Distress" value={distressedShips.length} highlight={distressedShips.length > 0} />
        </div>

        {/* Right: user + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] rounded-[6px] bg-[#58A6FF]/15 border border-[#58A6FF]/20 flex items-center justify-center text-[11px] font-bold text-[#58A6FF]">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="text-[12px] text-[#8B949E]">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#8B949E] border border-[#30363D] bg-transparent hover:bg-[#1C2333] hover:text-[#F0F6FC] transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <FleetMap
            fleet={fleet}
            zones={zones}
            onShipClick={ship => setSelectedShip(ship)}
          />

          {/* Zones count badge */}
          {zones.length > 0 && (
            <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#161B22]/90 border border-[#30363D] text-[#F85149] backdrop-blur-sm">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
              </svg>
              {zones.length} restricted zone{zones.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-[360px] flex-shrink-0 flex flex-col border-l border-[#30363D] bg-[#161B22] overflow-hidden">

          {/* Alert Panel — top half */}
          <div className="flex flex-col overflow-hidden" style={{ flex: '1', minHeight: 0 }}>
            <AlertPanel userRole={user?.role} />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#30363D] flex-shrink-0" />

          {/* Ship Detail Panel — bottom half */}
          <div className="flex flex-col overflow-hidden" style={{ flex: '1', minHeight: 0 }}>
            <ShipDetailPanel
              ship={liveSelectedShip}
              onIssueDirective={user?.role === 'command' ? (s) => setSelectedShip(s) : null}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
