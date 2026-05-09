import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePusher } from '../context/PusherContext'
import FleetMap from '../components/map/FleetMap'
import AlertPanel from '../components/alerts/AlertPanel'
import ShipDetailPanel from '../components/ships/ShipDetailPanel'
import DirectiveComposer from '../components/directives/DirectiveComposer'
import DirectiveFeed from '../components/directives/DirectiveFeed'
import api from '../utils/api'
import toast from 'react-hot-toast'

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

export default function CommandDashboard() {
  const { user, logout }   = useAuth()
  const { fleet, alerts, zones, loading } = usePusher()

  const [selectedShip,   setSelectedShip]   = useState(null)
  const [composerOpen,   setComposerOpen]   = useState(false)
  const [sidebarTab,     setSidebarTab]     = useState('alerts')
  const [pendingPolygon, setPendingPolygon] = useState(null)

  const activeAlerts    = alerts.filter(a => a.status === 'active')
  const distressedShips = fleet.filter(s => s.status === 'distressed' || s.status === 'stranded')
  const liveShip        = selectedShip ? fleet.find(s => s._id === selectedShip._id) || selectedShip : null

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
            {['alerts', 'directives'].map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 h-[42px] text-[11px] font-semibold uppercase tracking-[0.1em] transition-all relative ${
                  sidebarTab === tab ? 'text-[#F0F6FC]' : 'text-[#484F58] hover:text-[#8B949E]'
                }`}
              >
                {tab}
                {tab === 'alerts' && activeAlerts.length > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F85149]/15 text-[#F85149]">
                    {activeAlerts.length}
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
            {sidebarTab === 'alerts' ? <AlertPanel userRole={user?.role} /> : <DirectiveFeed />}
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
