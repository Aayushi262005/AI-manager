import React from 'react'

const formatElapsed = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const FocusBar = ({ task, elapsedSeconds, onEnd }) => (
  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-xl px-5 py-3 flex items-center gap-4 max-w-[92vw]">
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
    </span>

    <div className="min-w-0">
      <div className="text-sm font-semibold text-foreground truncate max-w-[220px]">{task.title}</div>
      <div className="text-[11px] text-muted-foreground">Focus session running</div>
    </div>

    <div className="text-lg font-bold text-foreground tabular-nums shrink-0">
      {formatElapsed(elapsedSeconds)}
    </div>

    <button
      onClick={onEnd}
      className="shrink-0 bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md hover:shadow-lg transition-all"
    >
      End session
    </button>
  </div>
)

export default FocusBar