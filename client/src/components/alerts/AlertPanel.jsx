import { useState } from 'react'
import api from '../../utils/api'
import { usePusher } from '../../context/PusherContext'

const SEVERITY_STYLES = {
  critical: { bar: 'bg-[#F85149]', badge: 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/20', label: 'CRITICAL' },
  high:     { bar: 'bg-[#E3B341]', badge: 'bg-[#E3B341]/15 text-[#E3B341] border border-[#E3B341]/20', label: 'HIGH' },
  medium:   { bar: 'bg-[#E3B341]/60', badge: 'bg-[#E3B341]/10 text-[#E3B341]/80 border border-[#E3B341]/15', label: 'MEDIUM' },
  low:      { bar: 'bg-[#58A6FF]/50', badge: 'bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/15', label: 'LOW' },
}

const TYPE_ICONS = {
  geofence:  '⬡',
  proximity: '◎',
  distress:  '△',
  fuel:      '◈',
  stranded:  '✕',
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function AlertPanel({ userRole }) {
  const { alerts, setAlerts } = usePusher()
  const [acking, setAcking]   = useState(null)

  const active = alerts.filter(a => a.status === 'active')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })

  async function acknowledge(id) {
    setAcking(id)
    try {
      const { data } = await api.put(`/alerts/${id}/acknowledge`)
      setAlerts(prev => prev.map(a => a._id === id ? data : a))
    } catch { /* noop */ }
    finally { setAcking(null) }
  }

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[42px] border-b border-[#30363D] flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">
          Active Alerts
        </span>
        <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          active.length > 0
            ? 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/20'
            : 'bg-[#8B949E]/10 text-[#484F58] border-[#30363D]'
        }`}>
          {active.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#484F58]">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">All clear</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {active.map(alert => {
              const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low
              return (
                <div
                  key={alert._id}
                  className="relative rounded-lg border border-[#21262D] bg-[#0B0E14] overflow-hidden"
                >
                  {/* Left severity bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.bar}`} />

                  <div className="pl-4 pr-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[#8B949E] text-[13px] flex-shrink-0">
                          {TYPE_ICONS[alert.type] || '●'}
                        </span>
                        <p className="text-[12px] text-[#F0F6FC] leading-snug line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-[9px] font-bold tracking-[0.1em] px-1.5 py-0.5 rounded ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#484F58]">
                        {timeAgo(alert.createdAt)}
                      </span>
                      {userRole === 'command' && (
                        <button
                          onClick={() => acknowledge(alert._id)}
                          disabled={acking === alert._id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#58A6FF]/08 text-[#58A6FF] border border-[#58A6FF]/20 hover:bg-[#58A6FF]/15 transition-colors disabled:opacity-40 tracking-wide"
                        >
                          {acking === alert._id ? '…' : 'ACK'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
