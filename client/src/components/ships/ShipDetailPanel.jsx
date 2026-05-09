const STATUS_STYLE = {
  normal:            { cls: 'bg-[#2EA043]/12 text-[#2EA043] border-[#2EA043]/20',  label: 'Normal' },
  rerouting:         { cls: 'bg-[#E3B341]/12 text-[#E3B341] border-[#E3B341]/20',  label: 'Rerouting' },
  distressed:        { cls: 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/20',  label: 'Distressed' },
  stopped:           { cls: 'bg-[#8B949E]/10 text-[#8B949E] border-[#30363D]',     label: 'Stopped' },
  stranded:          { cls: 'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/20',  label: 'Stranded' },
  arrived:           { cls: 'bg-[#58A6FF]/12 text-[#58A6FF] border-[#58A6FF]/20',  label: 'Arrived' },
  insufficient_fuel: { cls: 'bg-[#E3B341]/12 text-[#E3B341] border-[#E3B341]/20',  label: 'Low Fuel' },
}

function FuelBar({ remaining, capacity }) {
  const pct = Math.max(0, Math.min(100, (remaining / capacity) * 100))
  const color = pct > 30 ? '#2EA043' : pct > 10 ? '#E3B341' : '#F85149'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-[#8B949E]">Fuel</span>
        <span className="font-mono font-semibold" style={{ color }}>
          {pct.toFixed(0)}%
          <span className="text-[#484F58] font-normal ml-1">
            ({remaining.toFixed(0)}t)
          </span>
        </span>
      </div>
      <div className="h-[4px] bg-[#21262D] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function StatCell({ label, value, mono = true }) {
  return (
    <div className="bg-[#0B0E14] border border-[#21262D] rounded-lg p-2.5">
      <div className="text-[10px] text-[#484F58] uppercase tracking-[0.07em] mb-1">{label}</div>
      <div className={`text-[13px] font-semibold text-[#F0F6FC] ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}

export default function ShipDetailPanel({ ship, onIssueDirective }) {
  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-[#484F58] p-6">
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M3 12h18M3 6h18M3 18h18" />
        </svg>
        <p className="text-xs text-center leading-relaxed">
          Click any ship on the map<br />to view details
        </p>
      </div>
    )
  }

  const st = STATUS_STYLE[ship.status] || STATUS_STYLE.normal

  return (
    <div className="flex flex-col overflow-hidden flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[42px] border-b border-[#30363D] flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B949E]">
          Ship Detail
        </span>
        <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded border ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3">
        {/* Name + ID */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#F0F6FC] leading-tight">{ship.name}</h3>
            <p className="font-mono text-[11px] text-[#484F58] mt-0.5">{ship.shipId}</p>
          </div>
          {ship.inAdverseWeather && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md bg-[#E3B341]/10 text-[#E3B341] border border-[#E3B341]/20 flex-shrink-0">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Weather
            </span>
          )}
        </div>

        {/* Fuel bar */}
        <FuelBar remaining={ship.fuelRemaining} capacity={ship.fuelCapacity} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatCell label="Speed"   value={`${ship.speed} kn`} />
          <StatCell label="Heading" value={`${ship.heading}°`} />
          <StatCell label="Lat"     value={ship.position.lat.toFixed(4)} />
          <StatCell label="Lng"     value={ship.position.lng.toFixed(4)} />
        </div>

        {/* Destination */}
        <div className="bg-[#0B0E14] border border-[#21262D] rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.07em] text-[#484F58]">Destination</span>
          <span className="text-[12px] font-semibold text-[#F0F6FC]">{ship.destination?.name || '—'}</span>
        </div>

        {/* Cargo */}
        <div className="bg-[#0B0E14] border border-[#21262D] rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.07em] text-[#484F58]">Cargo</span>
          <span className="text-[12px] font-semibold text-[#F0F6FC] capitalize">{ship.cargo}</span>
        </div>

        {/* Issue directive button — command only */}
        {onIssueDirective && (
          <button
            onClick={() => onIssueDirective(ship)}
            className="w-full py-2.5 rounded-lg text-[13px] font-semibold bg-[#58A6FF] text-[#0B0E14] hover:bg-[#79B8FF] active:bg-[#388BFD] transition-colors tracking-wide mt-1"
          >
            Issue Directive
          </button>
        )}
      </div>
    </div>
  )
}
