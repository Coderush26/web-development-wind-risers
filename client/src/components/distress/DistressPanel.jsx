import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const SEVERITY_STYLES = {
  critical: 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/20',
  high:     'bg-[#E3B341]/12 text-[#E3B341] border-[#E3B341]/20',
  medium:   'bg-[#E3B341]/08 text-[#E3B341]/80 border-[#E3B341]/15',
  low:      'bg-[#58A6FF]/10 text-[#58A6FF] border-[#58A6FF]/20',
}

export default function DistressPanel({ ship }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState(null)

  async function send() {
    if (!message.trim()) { toast.error('Enter a distress message'); return }
    setSending(true)
    try {
      const { data } = await api.post('/distress', { shipId: ship._id, message: message.trim() })
      setResult(data)
      setMessage('')
      toast.success('Distress signal sent to Command')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send distress signal')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      <div className="flex items-center px-4 h-[42px] border-b border-[#30363D] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F85149]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">
            Distress Signal
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin">

        {/* AI extraction result */}
        {result?.aiExtracted && (
          <div className="bg-[#0B0E14] border border-[#30363D] rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">AI Analysis</span>
              <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[result.aiExtracted.severity] || SEVERITY_STYLES.medium}`}>
                {result.aiExtracted.severity}
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#F0F6FC] leading-relaxed">
              {result.aiExtracted.issue}
            </p>
            {result.aiExtracted.injuryCount != null && (
              <p className="font-mono text-[10px] text-[#8B949E]">
                Injuries: {result.aiExtracted.injuryCount}
              </p>
            )}
            {result.aiExtracted.damageEstimate && (
              <p className="font-mono text-[10px] text-[#8B949E]">
                Damage: {result.aiExtracted.damageEstimate}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="10" height="10" fill="#2EA043" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-medium text-[#2EA043]">Alert sent to Command</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.08em] text-[#484F58]">
            Situation Report
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the emergency in plain language. AI will extract severity and details."
            rows={4}
            className="w-full bg-[#0B0E14] border border-[#30363D] rounded-lg px-3 py-2 text-[12px] text-[#F0F6FC] outline-none focus:border-[#F85149]/60 focus:ring-1 focus:ring-[#F85149]/10 resize-none font-mono placeholder:text-[#484F58] transition-all"
          />
        </div>

        <button
          onClick={send}
          disabled={sending || !message.trim()}
          className="w-full py-2.5 rounded-lg text-[13px] font-semibold bg-[#F85149] text-white hover:bg-[#ff6b64] active:bg-[#da3633] transition-colors disabled:opacity-40 tracking-wide"
        >
          {sending ? 'Sending…' : 'Send Distress Signal'}
        </button>
      </div>
    </div>
  )
}
