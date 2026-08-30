import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, Calendar,
  CheckCircle2, Circle, Pin, Clock, ArrowRightCircle, RotateCcw,
  CalendarClock, GripVertical,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPlans, subscribeToTasks, toggleTask, setTaskPinnedDate } from '../services/planService'
import { subscribeToCapacitySettings, subscribeToOverrides } from '../services/capacityService'
import { allocateSchedule, addDays, toDateStr } from '../utils/scheduler'
import { formatMins } from '../utils/format'
import PriorityDot from './PriorityDot'

const todayStr = () => toDateStr(new Date())

const dayLabel = (dateStr, isToday) => {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate(),
  }
}

const PlannerSection = () => {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [plansLoaded, setPlansLoaded] = useState(false)
  const [defaultHours, setDefaultHours] = useState(4)
  const [overrides, setOverrides] = useState({})
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [view, setView] = useState('week') // 'week' | 'month'
  const [monthCursor, setMonthCursor] = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [movingTaskId, setMovingTaskId] = useState(null) // which task row has its date-picker open
  const [actionError, setActionError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [tasksByPlan, setTasksByPlan] = useState({})
  const [loadedPlanIds, setLoadedPlanIds] = useState(new Set())
  const [dragOverDate, setDragOverDate] = useState(null) // which day cell is currently a drop target

  // Plans and their tasks are separate listener sets: plans is one small
  // query, and each plan gets its own scoped tasks listener (instead of one
  // giant collection-group query across every user's tasks in the whole
  // database, which is what used to make this feel slow).
  useEffect(() => {
    if (!user) return
    const unsub1 = subscribeToPlans(user.uid, (p) => { setPlans(p); setPlansLoaded(true) })
    const unsub3 = subscribeToCapacitySettings(user.uid, setDefaultHours)
    const unsub4 = subscribeToOverrides(user.uid, setOverrides)
    return () => { unsub1(); unsub3(); unsub4() }
  }, [user])

  useEffect(() => {
    if (!user || plans.length === 0) return
    const unsubs = plans.map((plan) =>
      subscribeToTasks(user.uid, plan.id, (tasks) => {
        setTasksByPlan((prev) => ({ ...prev, [plan.id]: tasks.map((t) => ({ ...t, planId: plan.id })) }))
        setLoadedPlanIds((prev) => new Set(prev).add(plan.id))
      })
    )
    return () => unsubs.forEach((u) => u())
  }, [user, plans])

  // Derived, not stored: a plan that's since been deleted just falls out
  // of `plans`, so its stale entry here is filtered out on the next render
  // instead of needing an explicit "clear tasks" effect.
  const planIds = useMemo(() => new Set(plans.map((p) => p.id)), [plans])
  const allTasks = useMemo(
    () => Object.entries(tasksByPlan).filter(([planId]) => planIds.has(planId)).flatMap(([, tasks]) => tasks),
    [tasksByPlan, planIds]
  )
  const loading = !plansLoaded || (plans.length > 0 && !plans.every((p) => loadedPlanIds.has(p.id)))

  const { schedule, warnings } = useMemo(() => {
    const plansWithTasks = plans.map((plan) => ({
      ...plan,
      tasks: allTasks.filter((t) => t.planId === plan.id),
    }))
    return allocateSchedule({ plans: plansWithTasks, defaultHours, overrides, today: new Date() })
  }, [plans, allTasks, defaultHours, overrides])

  const scheduleByDate = useMemo(() => {
    const map = {}
    schedule.forEach((day) => { map[day.date] = day })
    return map
  }, [schedule])

  const weekDates = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const weekStart = addDays(start, weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => toDateStr(addDays(weekStart, i)))
  }, [weekOffset])

  const selectedDay = scheduleByDate[selectedDate]
  const selectedDayCapacityHours = (overrides[selectedDate] ?? defaultHours)

  // Any transient status/error message clears itself after a few seconds.
  useEffect(() => {
    if (!statusMsg && !actionError) return
    const t = setTimeout(() => { setStatusMsg(''); setActionError('') }, 4000)
    return () => clearTimeout(t)
  }, [statusMsg, actionError])

  const selectDate = (d) => { setSelectedDate(d); setMovingTaskId(null) }

  // Every Firestore-writing action goes through this so a failure is
  // always visible instead of silently doing nothing — and shows the
  // *actual* reason (e.g. a permissions error), not a generic guess.
  const runAction = async (fn, successMsg) => {
    try {
      await fn()
      if (successMsg) setStatusMsg(successMsg)
    } catch (err) {
      console.error(err)
      const reason =
        err?.code === 'permission-denied'
          ? "You don't have permission to save this (check Firestore rules)."
          : err?.code === 'unavailable'
          ? "Couldn't reach the server — check your connection and try again."
          : err?.message || 'Something went wrong saving that.'
      setActionError(reason)
    }
  }

  const handleToggle = (task) =>
    runAction(() => toggleTask(user.uid, task.planId, task.id, !task.done))

  const movetaskTo = (task, newDateStr) =>
    runAction(() => setTaskPinnedDate(user.uid, task.planId, task.id, newDateStr))
  const handleUnpin = (task) =>
    runAction(() => setTaskPinnedDate(user.uid, task.planId, task.id, null), `"${task.title}" set back to auto-scheduled.`)

  // Drag-and-drop: only the small grip handle on a task row is draggable
  // (not the whole row), so it can never intercept a click on the checkbox
  // next to it. Drop it on any day cell in the week/month view to move it.
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, planId: task.planId }))
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDropOnDate = (e, dateStr) => {
    e.preventDefault()
    setDragOverDate(null)
    let payload
    try { payload = JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return }
    if (!payload?.taskId) return
    const task = allTasks.find((t) => t.id === payload.taskId && t.planId === payload.planId)
    if (task) movetaskTo(task, dateStr)
  }

  const handlePushDayForward = () => {
    if (!selectedDay || selectedDay.items.length === 0) return
    const nextDate = toDateStr(addDays(new Date(selectedDay.date + 'T00:00:00'), 1))
    const count = selectedDay.items.length
    runAction(
      () => Promise.all(selectedDay.items.map((task) => setTaskPinnedDate(user.uid, task.planId, task.id, nextDate))),
      `Moved ${count} task${count > 1 ? 's' : ''} to tomorrow.`
    )
  }
  const handleAutoBalanceDay = () => {
    if (!selectedDay) return
    const pinnedItems = selectedDay.items.filter((t) => t.isPinned)
    if (pinnedItems.length === 0) return
    runAction(
      () => Promise.all(pinnedItems.map((task) => setTaskPinnedDate(user.uid, task.planId, task.id, null))),
      'Handed this day back to auto-scheduling.'
    )
  }

  return (
    <div className="flex-1 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your auto-scheduled workload, day by day — drag the grip on any task to move it.</p>
        </div>
        <div className="flex items-center bg-muted rounded-xl p-1">
          <button
            onClick={() => setView('week')}
            className={`p-2 rounded-lg transition-colors ${view === 'week' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
            title="Week view"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('month')}
            className={`p-2 rounded-lg transition-colors ${view === 'month' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
            title="Month view"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-xs text-rose-700">{w.message}</p>
            ))}
            {warnings.length > 3 && (
              <p className="text-xs text-rose-500">+{warnings.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-rose-700">
          {actionError}
        </div>
      )}
      {statusMsg && !actionError && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-emerald-700">
          {statusMsg}
        </div>
      )}

      {loading ? (
        <PlannerSkeleton />
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            Create a plan with some tasks first — your schedule will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {view === 'week' ? (
            <WeekView
              weekDates={weekDates}
              scheduleByDate={scheduleByDate}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onPrev={() => setWeekOffset((w) => Math.max(0, w - 1))}
              onNext={() => setWeekOffset((w) => w + 1)}
              canGoPrev={weekOffset > 0}
              dragOverDate={dragOverDate}
              setDragOverDate={setDragOverDate}
              onDrop={handleDropOnDate}
            />
          ) : (
            <MonthView
              monthCursor={monthCursor}
              setMonthCursor={setMonthCursor}
              scheduleByDate={scheduleByDate}
              selectedDate={selectedDate}
              onSelectDate={(d) => { selectDate(d); setView('week') }}
              dragOverDate={dragOverDate}
              setDragOverDate={setDragOverDate}
              onDrop={handleDropOnDate}
            />
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {selectedDate === todayStr() ? "Today's tasks" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Read-only — capacity is set once in Settings and applies
                    everywhere (including here), instead of having a second
                    place to edit it that can drift out of sync. */}
                <span
                  className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-xl px-2.5 py-1.5"
                  title="Set in Settings → Study capacity"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {selectedDay ? `${formatMins(selectedDay.usedMinutes)} / ${selectedDayCapacityHours}h` : `${selectedDayCapacityHours}h capacity`}
                </span>

                {selectedDay && selectedDay.items.length > 0 && (
                  <button
                    onClick={handlePushDayForward}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-accent rounded-xl px-2.5 py-1.5 transition-colors"
                    title="Push every task scheduled today to tomorrow"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" /> Push day to tomorrow
                  </button>
                )}
                {selectedDay && selectedDay.items.some((t) => t.isPinned) && (
                  <button
                    onClick={handleAutoBalanceDay}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-accent rounded-xl px-2.5 py-1.5 transition-colors"
                    title="Let the auto-scheduler place this day's manually-moved tasks again"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Auto-balance day
                  </button>
                )}
              </div>
            </div>

            {!selectedDay || selectedDay.items.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverDate(selectedDate) }}
                onDragLeave={() => setDragOverDate((d) => (d === selectedDate ? null : d))}
                onDrop={(e) => handleDropOnDate(e, selectedDate)}
                className={`text-sm text-muted-foreground rounded-2xl p-6 text-center border-2 border-dashed transition-colors ${
                  dragOverDate === selectedDate ? 'border-primary bg-accent/50' : 'border-transparent bg-muted'
                }`}
              >
                Nothing scheduled this day. Drag a task here to add it.
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverDate(selectedDate) }}
                onDragLeave={() => setDragOverDate((d) => (d === selectedDate ? null : d))}
                onDrop={(e) => handleDropOnDate(e, selectedDate)}
                className={`bg-card border rounded-2xl divide-y divide-border overflow-hidden transition-colors ${
                  dragOverDate === selectedDate ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                {selectedDay.items.map((task) => (
                  <TaskRow
                    key={task.key || task.id}
                    task={task}
                    currentDate={selectedDay.date}
                    isMoving={movingTaskId === (task.key || task.id)}
                    onToggle={() => handleToggle(task)}
                    onOpenMove={() => setMovingTaskId(movingTaskId === (task.key || task.id) ? null : (task.key || task.id))}
                    onPickDate={(dateStr) => { movetaskTo(task, dateStr); setMovingTaskId(null) }}
                    onUnpin={() => handleUnpin(task)}
                    onDragStart={(e) => handleDragStart(e, task)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── One task row inside the selected-day panel ──
const TaskRow = ({ task, currentDate, isMoving, onToggle, onOpenMove, onPickDate, onUnpin, onDragStart }) => (
  <div className="flex items-center gap-2 px-3 sm:px-5 py-3.5 hover:bg-muted/60 transition-colors">
    {/* Only this handle is draggable — not the row — so it can never
        intercept a click on the checkbox or title next to it. */}
    <span
      draggable
      onDragStart={onDragStart}
      title="Drag to another day"
      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground flex-shrink-0"
    >
      <GripVertical className="w-3.5 h-3.5" />
    </span>
    <span className="flex-shrink-0 cursor-pointer" onClick={onToggle}>
      {task.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-border" />}
    </span>
    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.planColor }} />
    <span className="flex-1 text-sm text-foreground truncate cursor-pointer min-w-[60px]" onClick={onToggle}>
      {task.title}
      {task.isSplit && <span className="ml-1.5 text-[10px] text-muted-foreground align-middle">(part)</span>}
    </span>
    <span className="hidden sm:inline text-xs text-muted-foreground flex-shrink-0">{task.planName}</span>
    <PriorityDot priority={task.priority} />
    <span className="text-xs text-muted-foreground flex-shrink-0">{formatMins(task.minutes ?? task.estMinutes)}</span>

    {/* Single, simple way to move a task: pick a new date. */}
    <div className="relative flex items-center gap-1 flex-shrink-0">
      <button
        onClick={onOpenMove}
        title="Move to a different day"
        className={`p-1.5 rounded-md hover:bg-muted ${task.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
      >
        {task.isPinned ? <Pin className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
      </button>
      {isMoving && (
        <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1.5">
          <input
            type="date"
            autoFocus
            defaultValue={currentDate}
            onChange={(e) => e.target.value && onPickDate(e.target.value)}
            className="text-sm px-2 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {task.isPinned && (
            <button
              onClick={onUnpin}
              className="text-xs text-muted-foreground hover:text-foreground text-left px-1"
            >
              Reset to auto-scheduled
            </button>
          )}
        </div>
      )}
    </div>
  </div>
)

// ── Week strip: 7 horizontally-laid-out day cards, each a drop target ──
const WeekView = ({ weekDates, scheduleByDate, selectedDate, onSelectDate, onPrev, onNext, canGoPrev, dragOverDate, setDragOverDate, onDrop }) => (
  <div className="flex items-center gap-2">
    <button onClick={onPrev} disabled={!canGoPrev} className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 flex-shrink-0">
      <ChevronLeft className="w-4 h-4" />
    </button>
    <div className="flex-1 grid grid-cols-7 gap-1.5 sm:gap-2">
      {weekDates.map((date) => {
        const day = scheduleByDate[date]
        const isToday = date === todayStr()
        const isSelected = date === selectedDate
        const { weekday, dayNum } = dayLabel(date, isToday)
        const taskCount = day?.items.length || 0
        const overCapacity = day?.overCapacity
        const isDragOver = dragOverDate === date

        return (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            onDragOver={(e) => { e.preventDefault(); setDragOverDate(date) }}
            onDragLeave={() => setDragOverDate((d) => (d === date ? null : d))}
            onDrop={(e) => onDrop(e, date)}
            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all ${
              isSelected ? 'border-primary bg-accent' : isDragOver ? 'border-primary/60 bg-accent/60' : 'border-transparent bg-card hover:bg-muted'
            }`}
          >
            <span className={`text-[10px] font-semibold uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{weekday}</span>
            <span className="text-base font-bold text-foreground">{dayNum}</span>
            {taskCount > 0 ? (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${overCapacity ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                {taskCount}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/40">—</span>
            )}
          </button>
        )
      })}
    </div>
    <button onClick={onNext} className="p-2 rounded-xl hover:bg-muted flex-shrink-0">
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
)

// ── Month grid: a full calendar-style grid, each day also a drop target ──
const MonthView = ({ monthCursor, setMonthCursor, scheduleByDate, selectedDate, onSelectDate, dragOverDate, setDragOverDate, onDrop }) => {
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const goPrevMonth = () => setMonthCursor(new Date(year, month - 1, 1))
  const goNextMonth = () => setMonthCursor(new Date(year, month + 1, 1))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={goPrevMonth} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-foreground">
          {monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={goNextMonth} className="p-2 rounded-xl hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground uppercase py-1.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <div key={i} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const day = scheduleByDate[dateStr]
          const isToday = dateStr === todayStr()
          const isSelected = dateStr === selectedDate
          const taskCount = day?.items.length || 0
          const isDragOver = dragOverDate === dateStr

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateStr) }}
              onDragLeave={() => setDragOverDate((d) => (d === dateStr ? null : d))}
              onDrop={(e) => onDrop(e, dateStr)}
              className={`min-h-[64px] sm:min-h-[80px] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                isSelected ? 'border-primary bg-accent' : isDragOver ? 'border-primary/60 bg-accent/60' : isToday ? 'border-primary/40 bg-card' : 'border-transparent bg-card hover:bg-muted'
              }`}
            >
              <span className="text-sm font-semibold text-foreground">{dayNum}</span>
              {taskCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${day.overCapacity ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                  {taskCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Loading skeleton so the "no plans" empty state doesn't flash on
// first load while the Firestore subscriptions are still connecting ──
const PlannerSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-7 gap-2 mb-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-muted" />
      ))}
    </div>
    <div className="h-4 w-32 rounded bg-muted mb-3" />
    <div className="space-y-2">
      <div className="h-14 rounded-2xl bg-muted" />
      <div className="h-14 rounded-2xl bg-muted" />
    </div>
  </div>
)

export default PlannerSection