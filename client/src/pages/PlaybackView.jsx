import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import FleetMap from '../components/map/FleetMap'

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function timeAgoLabel(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ago`
}

export default function PlaybackView() {
  const navigate = useNavigate()

  const [index,    setIndex]    = useState([])    // [{ _id, capturedAt }]
  const [cursor,   setCursor]   = useState(0)
  const [snapshot, setSnapshot] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [playing,  setPlaying]  = useState(false)

  const intervalRef  = useRef(null)
  const indexRef     = useRef([])   // stable ref so interval can read latest index

  useEffect(() => {
    api.get('/history').then(({ data }) => {
      setIndex(data)
      indexRef.current = data
      if (data.length > 0) {
        const last = data.length - 1
        setCursor(last)
        fetchSnapshot(data[last]._id)
      }
    }).catch(() => {}).finally(() => setLoading(false))

    return () => clearInterval(intervalRef.current)
  }, [])

  async function fetchSnapshot(id) {
    setFetching(true)
    try {
      const { data } = await api.get(`/history/${id}`)
      setSnapshot(data)
    } catch { /* noop */ }
    finally { setFetching(false) }
  }

  async function jump(idx) {
    const clamped = Math.max(0, Math.min(indexRef.current.length - 1, idx))
    setCursor(clamped)
    const snap = indexRef.current[clamped]
    if (snap) await fetchSnapshot(snap._id)
  }

  function togglePlay() {
    if (playing) {
      clearInterval(intervalRef.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    intervalRef.current = setInterval(() => {
      setCursor(prev => {
        const next = prev + 1
        if (next >= indexRef.current.length) {
          clearInterval(intervalRef.current)
          setPlaying(false)
          return prev
        }
        fetchSnapshot(indexRef.current[next]._id)
        return next
      })
    }, 600)
  }

  const currentEntry = index[cursor]
  const ships        = snapshot?.ships        || []
  const alertCount   = snapshot?.activeAlerts?.length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0E14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#E3B341] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8B949E] text-sm font-medium tracking-wide">Loading history…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0E14] overflow-hidden">

      {/* Nav */}
      <nav className="shrink-0 h-13 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#E3B341]/12 border border-[#E3B341]/25 flex items-center justify-center text-[#E3B341]">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
          </div>
          <span className="text-[13px] font-bold text-[#F0F6FC] tracking-[0.06em] uppercase">Fleet Playback</span>
          <div className="w-px h-4 bg-[#30363D]" />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E3B341] bg-[#E3B341]/10 border border-[#E3B341]/20 px-2.5 py-1 rounded-md uppercase tracking-[0.06em]">
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            History
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#484F58]">
            {index.length} snapshot{index.length !== 1 ? 's' : ''} &middot; 2hr window
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#58A6FF] border border-[#58A6FF]/30 hover:bg-[#58A6FF]/10 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EA043] animate-pulse" />
            Back to Live
          </button>
        </div>
      </nav>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <FleetMap
          fleet={ships}
          zones={[]}
          userRole={null}
          onShipClick={null}
          onZoneDrawn={null}
        />

        {/* Loading overlay */}
        {fetching && (
          <div className="absolute top-3 right-3 z-1000 flex items-center gap-1.5 text-[11px] text-[#E3B341] bg-[#161B22]/90 border border-[#E3B341]/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none">
            <div className="w-2 h-2 border border-[#E3B341] border-t-transparent rounded-full animate-spin" />
            Loading snapshot…
          </div>
        )}

        {/* Alert badge */}
        {alertCount > 0 && (
          <div className="absolute top-3 left-3 z-1000 flex items-center gap-1.5 text-[11px] text-[#F85149] bg-[#161B22]/90 border border-[#F85149]/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none">
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {alertCount} active alert{alertCount !== 1 ? 's' : ''} at this time
          </div>
        )}

        {/* Ship count */}
        {ships.length > 0 && (
          <div className="absolute bottom-3 left-3 z-1000 font-mono text-[11px] text-[#8B949E] bg-[#161B22]/90 border border-[#30363D] px-2.5 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none">
            {ships.length} ships &middot; snapshot
          </div>
        )}
      </div>

      {/* Timeline bar */}
      <div className="shrink-0 bg-[#161B22] border-t border-[#30363D] px-5 py-4">
        {index.length === 0 ? (
          <p className="text-[#484F58] text-xs text-center py-1">
            No history yet — snapshots are captured every 30 seconds.
          </p>
        ) : (
          <div className="flex flex-col gap-3">

            {/* Scrubber track */}
            <div className="relative flex items-center gap-3">
              <span className="font-mono text-[10px] text-[#484F58] shrink-0 w-16">
                {index[0] ? formatTime(index[0].capturedAt) : '—'}
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, index.length - 1)}
                  value={cursor}
                  onChange={e => jump(Number(e.target.value))}
                  className="w-full accent-[#58A6FF] cursor-pointer"
                  style={{ height: '4px' }}
                />
              </div>
              <span className="font-mono text-[10px] text-[#484F58] shrink-0 w-16 text-right">
                {index[index.length - 1] ? formatTime(index[index.length - 1].capturedAt) : '—'}
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">

              {/* Transport controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => jump(0)}
                  title="Jump to start"
                  className="w-7 h-7 flex items-center justify-center rounded text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#1C2333] transition-colors"
                >
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                  </svg>
                </button>
                <button
                  onClick={() => jump(cursor - 1)}
                  disabled={cursor === 0}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#1C2333] transition-colors disabled:opacity-30"
                >
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm12 0-8.5 6 8.5 6z" />
                  </svg>
                </button>

                <button
                  onClick={togglePlay}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/25 hover:bg-[#58A6FF]/25 transition-colors mx-1"
                >
                  {playing ? (
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => jump(cursor + 1)}
                  disabled={cursor >= index.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#1C2333] transition-colors disabled:opacity-30"
                >
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => jump(index.length - 1)}
                  title="Jump to latest"
                  className="w-7 h-7 flex items-center justify-center rounded text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#1C2333] transition-colors"
                >
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* Time readout */}
              <div className="flex items-center gap-4">
                {currentEntry ? (
                  <>
                    <span className="font-mono text-[14px] font-semibold text-[#F0F6FC]">
                      {formatTime(currentEntry.capturedAt)}
                    </span>
                    <span className="font-mono text-[11px] text-[#484F58]">
                      {timeAgoLabel(currentEntry.capturedAt)}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-[11px] text-[#484F58]">—</span>
                )}
                <span className="font-mono text-[11px] text-[#30363D]">|</span>
                <span className="font-mono text-[11px] text-[#484F58]">
                  {cursor + 1} / {index.length}
                </span>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  )
}
