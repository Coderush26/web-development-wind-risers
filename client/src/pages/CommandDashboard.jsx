import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePusher } from '../context/PusherContext'
import FleetMap from '../components/map/FleetMap'
import AlertPanel from '../components/alerts/AlertPanel'
import ShipDetailPanel from '../components/ships/ShipDetailPanel'
import DirectiveComposer from '../components/directives/DirectiveComposer'
import DirectiveFeed from '../components/directives/DirectiveFeed'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { playAlertSound } from '../utils/sounds'

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

function ZoneNameModal({ polygon, onConfirm, onCancel }) {
  const [name,   setName]   = useState('')
  const [type,   setType]   = useState('restricted')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!name.trim()) { toast.error('Zone name is required'); return }
    setSaving(true)
    try {
      await onConfirm({ name: name.trim(), type, polygon })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-2000 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-sm font-bold text-[#F0F6FC] mb-1">Name Restricted Zone</h3>
        <p className="text-xs text-[#8B949E] mb-5">
          Polygon drawn with {polygon.length} vertices. All active ships will be rerouted.
        </p>

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.08em] text-[#484F58] mb-1.5">Zone Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirm()}
              placeholder="e.g. Naval Exclusion Zone Alpha"
              className="w-full bg-[#0B0E14] border border-[#30363D] rounded-lg px-3 py-2 text-[13px] text-[#F0F6FC] outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]/20 transition-all placeholder:text-[#484F58]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.08em] text-[#484F58] mb-1.5">Zone Type</label>
            <div className="flex gap-2">
              {['restricted', 'weather'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                    type === t
                      ? 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/30'
                      : 'bg-transparent text-[#8B949E] border-[#30363D] hover:border-[#484F58]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-[#8B949E] border border-[#30363D] hover:bg-[#1C2333] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#F85149] text-white hover:bg-[#ff6b64] transition-all disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create Zone'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ZONE_TYPE_STYLE = {
  restricted: 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/25',
  weather:    'bg-[#E3B341]/12 text-[#E3B341] border-[#E3B341]/25',
}

function ZonesPanel({ zones, onDelete }) {
  const [deleting, setDeleting] = useState(null)

  async function del(id) {
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 h-10.5 border-b border-[#30363D] flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8B949E]">Active Zones</span>
        <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          zones.length > 0
            ? 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/20'
            : 'bg-[#8B949E]/10 text-[#484F58] border-[#30363D]'
        }`}>{zones.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#484F58]">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs font-medium">No active zones</span>
            <span className="text-[10px] text-[#484F58]">Draw a zone on the map</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {zones.map(zone => (
              <div key={zone._id} className="flex items-center gap-3 bg-[#0B0E14] border border-[#21262D] rounded-lg px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#F0F6FC] truncate">{zone.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${ZONE_TYPE_STYLE[zone.type] || ZONE_TYPE_STYLE.restricted}`}>
                      {zone.type}
                    </span>
                    <span className="font-mono text-[10px] text-[#484F58]">{zone.polygon?.length} pts</span>
                  </div>
                </div>
                <button
                  onClick={() => del(zone._id)}
                  disabled={deleting === zone._id}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#F85149]/08 text-[#F85149] border border-[#F85149]/20 hover:bg-[#F85149]/20 transition-colors disabled:opacity-40"
                >
                  {deleting === zone._id
                    ? <span className="text-[10px]">…</span>
                    : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommandDashboard() {
  const { user, logout }   = useAuth()
  const { fleet, alerts, zones, loading, setZones } = usePusher()
  const navigate = useNavigate()

  const [selectedShip,   setSelectedShip]   = useState(null)
  const [composerOpen,   setComposerOpen]   = useState(false)
  const [sidebarTab,     setSidebarTab]     = useState('alerts')
  const [pendingPolygon, setPendingPolygon] = useState(null)

  // Always-on sound watcher — independent of which sidebar tab is active
  const seenAlertsRef = useRef(new Set())
  useEffect(() => {
    alerts.forEach(a => {
      if (!seenAlertsRef.current.has(a._id)) {
        seenAlertsRef.current.add(a._id)
        if (a.status === 'active') playAlertSound(a.severity, a.type)
      }
    })
  }, [alerts])

  const activeAlerts    = alerts.filter(a => a.status === 'active')
  const distressedShips = fleet.filter(s => s.status === 'distressed' || s.status === 'stranded')
  const liveShip        = selectedShip ? fleet.find(s => s._id === selectedShip._id) || selectedShip : null

  async function handleZoneDeleted(zoneId) {
    try {
      await api.delete(`/zones/${zoneId}`)
      setZones(prev => prev.filter(z => z._id !== zoneId))
      toast.success('Zone removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete zone')
    }
  }

  async function handleZoneCreated({ name, type, polygon }) {
    try {
      await api.post('/zones', { name, type, polygon })
      toast.success(`Zone "${name}" created — ships rerouting`)
      setPendingPolygon(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create zone')
    }
  }

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

      {/* ── Nav ── */}
      <nav className="shrink-0 h-13 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-3">
          <NavLogo />
          <span className="text-[13px] font-bold text-[#F0F6FC] tracking-[0.06em] uppercase">Fleet Command</span>
          <div className="w-px h-4 bg-[#30363D]" />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2EA043] bg-[#2EA043]/10 border border-[#2EA043]/20 px-2.5 py-1 rounded-md uppercase tracking-[0.06em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EA043] animate-pulse" />
            Live
          </span>
        </div>

        {/* Center stats */}
        <div className="flex items-center gap-1 bg-[#0B0E14] border border-[#21262D] rounded-lg px-1 py-1">
          {[
            { label: 'Ships',   value: fleet.length,            red: false },
            { label: 'Alerts',  value: activeAlerts.length,     red: activeAlerts.length > 0 },
            { label: 'Distress',value: distressedShips.length,  red: distressedShips.length > 0 },
            { label: 'Zones',   value: zones.length,            red: false },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center">
              <div className="flex items-center gap-2 px-3 py-1">
                <span className="text-[11px] text-[#484F58]">{s.label}</span>
                <span className={`font-mono text-[13px] font-semibold ${s.red ? 'text-[#F85149]' : 'text-[#F0F6FC]'}`}>
                  {s.value}
                </span>
              </div>
              {i < arr.length - 1 && <div className="w-px h-4 bg-[#21262D]" />}
            </div>
          ))}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-md bg-[#58A6FF]/15 border border-[#58A6FF]/20 flex items-center justify-center text-[11px] font-bold text-[#58A6FF]">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="text-xs text-[#8B949E]">{user?.firstName} {user?.lastName}</span>
          </div>
          <button
            onClick={() => navigate('/playback')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#E3B341] border border-[#E3B341]/25 hover:bg-[#E3B341]/10 transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
            Playback
          </button>
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

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <FleetMap
            fleet={fleet}
            zones={zones}
            userRole={user?.role}
            onShipClick={ship => { setSelectedShip(ship); setComposerOpen(false) }}
            onZoneDrawn={polygon => setPendingPolygon(polygon)}
            onZoneDelete={handleZoneDeleted}
          />

          {zones.length > 0 && (
            <div className="absolute top-3 left-3 z-1000 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#161B22]/90 border border-[#30363D] text-[#F85149] backdrop-blur-sm pointer-events-none">
              <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {zones.length} zone{zones.length > 1 ? 's' : ''}
            </div>
          )}

          {pendingPolygon && (
            <ZoneNameModal
              polygon={pendingPolygon}
              onConfirm={handleZoneCreated}
              onCancel={() => setPendingPolygon(null)}
            />
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-90 shrink-0 flex flex-col border-l border-[#30363D] bg-[#161B22] overflow-hidden">

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-[#30363D]">
            {['alerts', 'directives', 'zones'].map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 h-10.5 text-[11px] font-semibold uppercase tracking-widest transition-all relative ${
                  sidebarTab === tab ? 'text-[#F0F6FC]' : 'text-[#484F58] hover:text-[#8B949E]'
                }`}
              >
                {tab}
                {tab === 'alerts' && activeAlerts.length > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F85149]/15 text-[#F85149]">
                    {activeAlerts.length}
                  </span>
                )}
                {tab === 'zones' && zones.length > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F85149]/15 text-[#F85149]">
                    {zones.length}
                  </span>
                )}
                {sidebarTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#58A6FF] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Top half */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
            {sidebarTab === 'alerts'     && <AlertPanel userRole={user?.role} />}
            {sidebarTab === 'directives' && <DirectiveFeed />}
            {sidebarTab === 'zones'      && <ZonesPanel zones={zones} onDelete={handleZoneDeleted} />}
          </div>

          <div className="h-px bg-[#30363D] shrink-0" />

          {/* Bottom half */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
            {composerOpen && liveShip
              ? <DirectiveComposer
                  ship={liveShip}
                  onBack={() => setComposerOpen(false)}
                  onSent={() => { setComposerOpen(false); setSidebarTab('directives') }}
                />
              : <ShipDetailPanel
                  ship={liveShip}
                  onIssueDirective={() => setComposerOpen(true)}
                />
            }
          </div>

        </div>
      </div>
    </div>
  )
}
