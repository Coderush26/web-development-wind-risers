import { useState, useEffect, useRef } from 'react'
import { usePusher } from '../../context/PusherContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { playDirectiveSound } from '../../utils/sounds'

const TYPE_LABELS = {
  reroute:         'Reroute',
  divert_waypoint: 'Divert Waypoint',
  hold_position:   'Hold Position',
}

function describeDirective(d) {
  if (d.type === 'reroute') return `Reroute to ${d.payload?.newDestination?.name || '—'}`
  if (d.type === 'divert_waypoint') {
    const wp = d.payload?.waypoint
    return wp ? `Divert via (${wp.lat?.toFixed(2)}, ${wp.lng?.toFixed(2)})` : 'Divert to waypoint'
  }
  return 'Hold position immediately'
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function DirectiveInbox({ ship }) {
  const { directives, setDirectives } = usePusher()
  const [responding,  setResponding]  = useState(null)
  const [expandedId,  setExpandedId]  = useState(null)
  const [escalateMsg, setEscalateMsg] = useState('')
  const seenRef = useRef(new Set())

  // Play sound when a new pending directive arrives via Pusher
  useEffect(() => {
    directives.forEach(d => {
      if (d.status === 'pending' && !seenRef.current.has(d._id)) {
        seenRef.current.add(d._id)
        playDirectiveSound()
      }
    })
  }, [directives])

  // Load any pre-existing pending directives for this ship on mount
  useEffect(() => {
    api.get('/directives/mine')
      .then(({ data }) => {
        if (!data.length) return
        setDirectives(prev => {
          const existingIds = new Set(prev.map(d => d._id))
          const fresh = data.filter(d => !existingIds.has(d._id))
          return fresh.length ? [...fresh, ...prev] : prev
        })
      })
      .catch(() => {})
  }, []) // eslint-disable-line

  const pending = directives.filter(d =>
    d.status === 'pending' &&
    (String(d.toShipId) === String(ship?._id) || String(d.toShipId?._id) === String(ship?._id))
  )

  async function accept(directive) {
    setResponding(directive._id)
    try {
      const { data } = await api.put(`/directives/${directive._id}/respond`, { response: 'ACCEPT' })
      setDirectives(prev => prev.map(d => d._id === directive._id ? data : d))
      toast.success('Directive accepted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond')
    } finally {
      setResponding(null)
    }
  }

  async function escalate(directive) {
    if (!escalateMsg.trim()) { toast.error('Enter a distress message'); return }
    setResponding(directive._id)
    try {
      const { data } = await api.put(`/directives/${directive._id}/respond`, {
        response: 'ESCALATE_DISTRESS',
        distressMessage: escalateMsg.trim(),
      })
      setDirectives(prev => prev.map(d => d._id === directive._id ? data : d))
      setExpandedId(null)
      setEscalateMsg('')
      toast.success('Escalated to Command')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to escalate')
    } finally {
      setResponding(null)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 h-[42px] border-b border-[#30363D] shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">Directives</span>
        {pending.length > 0 && (
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E3B341]/12 text-[#E3B341] border border-[#E3B341]/20">
            {pending.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-[#484F58]">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">No pending directives</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {pending.map(directive => (
              <div key={directive._id} className="bg-[#0B0E14] border border-[#21262D] rounded-lg overflow-hidden">
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-[#E3B341]/12 text-[#E3B341] border border-[#E3B341]/20">
                      {TYPE_LABELS[directive.type] || directive.type}
                    </span>
                    <span className="font-mono text-[10px] text-[#484F58]">
                      {timeAgo(directive.createdAt)}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#F0F6FC] mb-2.5 leading-snug">
                    {describeDirective(directive)}
                  </p>

                  {expandedId === directive._id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        value={escalateMsg}
                        onChange={e => setEscalateMsg(e.target.value)}
                        placeholder="Describe the emergency situation..."
                        rows={3}
                        className="w-full bg-[#161B22] border border-[#F85149]/30 rounded-lg px-3 py-2 text-[12px] text-[#F0F6FC] outline-none focus:border-[#F85149]/60 resize-none font-mono placeholder:text-[#484F58] transition-all"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setExpandedId(null); setEscalateMsg('') }}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-[#8B949E] border border-[#30363D] hover:bg-[#1C2333] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => escalate(directive)}
                          disabled={responding === directive._id}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F85149] text-white hover:bg-[#ff6b64] transition-colors disabled:opacity-40"
                        >
                          {responding === directive._id ? 'Sending…' : 'Escalate'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => accept(directive)}
                        disabled={responding === directive._id}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-[#2EA043]/15 text-[#2EA043] border border-[#2EA043]/25 hover:bg-[#2EA043]/25 transition-colors disabled:opacity-40"
                      >
                        {responding === directive._id ? '…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => setExpandedId(directive._id)}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F85149]/12 text-[#F85149] border border-[#F85149]/25 hover:bg-[#F85149]/20 transition-colors"
                      >
                        Escalate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
