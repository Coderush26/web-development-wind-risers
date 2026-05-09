import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { usePusher } from '../../context/PusherContext'

const STATUS_STYLES = {
  pending:   { dot: 'bg-[#E3B341]', badge: 'bg-[#E3B341]/12 text-[#E3B341] border-[#E3B341]/20',  label: 'Pending' },
  accepted:  { dot: 'bg-[#2EA043]', badge: 'bg-[#2EA043]/12 text-[#2EA043] border-[#2EA043]/20',  label: 'Accepted' },
  escalated: { dot: 'bg-[#F85149]', badge: 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/20',  label: 'Escalated' },
}

const TYPE_LABELS = {
  reroute:         'Reroute',
  divert_waypoint: 'Divert Waypoint',
  hold_position:   'Hold Position',
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function DirectiveFeed() {
  const { directives } = usePusher()
  const [fetched, setFetched] = useState([])

  // Fetch recent directives for context on mount
  useEffect(() => {
    api.get('/directives/ship/all').catch(() => {})
    // We'll rely on Pusher directives + any pre-loaded ones
    // For a full list, directives come from Pusher context during session
  }, [])

  // Merge live Pusher directives with initial empty list
  const all = directives.length > 0 ? directives : fetched

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[42px] border-b border-[#30363D] flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">
          Directives
        </span>
        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-[#8B949E]/10 text-[#484F58] border-[#30363D]">
          {all.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#484F58]">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">No directives issued</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {all.map(d => {
              const s = STATUS_STYLES[d.status] || STATUS_STYLES.pending
              const ship = d.toShipId
              return (
                <div key={d._id} className="relative bg-[#0B0E14] border border-[#21262D] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${s.dot}`} />
                      <div>
                        <p className="text-[12px] font-semibold text-[#F0F6FC]">
                          {ship?.name || 'Unknown Ship'}
                        </p>
                        <p className="text-[11px] text-[#8B949E]">
                          {TYPE_LABELS[d.type] || d.type}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded border ${s.badge}`}>
                      {s.label}
                    </span>
                  </div>

                  {/* Escalated distress info */}
                  {d.status === 'escalated' && d.distressMessage && (
                    <div className="mt-2 p-2 bg-[#F85149]/08 border border-[#F85149]/15 rounded-md">
                      <p className="text-[10px] text-[#F85149] font-semibold uppercase tracking-wider mb-1">Distress</p>
                      <p className="text-[11px] text-[#8B949E] line-clamp-2">{d.distressMessage}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[10px] text-[#484F58]">
                      {d.fromUserId?.firstName} {d.fromUserId?.lastName}
                    </span>
                    <span className="font-mono text-[10px] text-[#484F58]">
                      {timeAgo(d.createdAt)}
                    </span>
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
