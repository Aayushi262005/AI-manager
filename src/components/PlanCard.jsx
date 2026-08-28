import React, { useEffect, useState } from 'react'
import { Trash2, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToTasks } from '../services/planService'
import { formatMins, daysLeftInfo } from '../utils/format'
import { computeStatus, TONE_CLASSES } from '../utils/planStatus'

const PlanCard = ({ plan, onOpen, onDelete }) => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  
  useEffect(() => {
    if (!user || !plan?.id) return
    const unsubscribe = subscribeToTasks(user.uid, plan.id, setTasks)
    return () => unsubscribe()
  }, [user, plan.id])

  const doneCount = tasks.filter((t) => t.done).length
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
  const remainingMins = tasks.filter((t) => !t.done).reduce((sum, t) => sum + (t.estMinutes || 0), 0)
  const { days, label: daysLabel, urgent } = daysLeftInfo(plan.deadline)
  const status = computeStatus(plan, tasks)

  return (
    <div
      onClick={() => onOpen(plan.id)}
      className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-ring/40 transition-all cursor-pointer group p-5"
    >
      {/* Thin accent line under the top edge, colored per-plan — matches the Figma "PinnedCard" look */}
      <div
        className="absolute top-0 left-8 right-8 h-[2px] rounded-b-full"
        style={{ background: `linear-gradient(to right, transparent, ${plan.color}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
            style={{ backgroundColor: plan.color }}
          >
            {plan.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{plan.name}</h3>
            {plan.description && (
              <p className="text-xs text-muted-foreground truncate">{plan.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(plan.id)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Status + progress bar */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TONE_CLASSES[status.tone]}`}>
          {status.label}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{progressPct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%`, backgroundColor: plan.color }}
        />
      </div>

      {/* 3-stat grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-xl py-2">
          <div className="text-xs font-bold text-foreground">{doneCount}/{tasks.length}</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">Tasks</div>
        </div>
        <div className="bg-muted rounded-xl py-2">
          <div className={`text-xs font-bold ${urgent ? 'text-destructive' : 'text-foreground'}`}>
            {days < 0 ? 'Overdue' : days}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">Days left</div>
        </div>
        <div className="bg-muted rounded-xl py-2">
          <div className="text-xs font-bold text-foreground">{formatMins(remainingMins)}</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">Remaining</div>
        </div>
      </div>
    </div>
  )
}

export default PlanCard