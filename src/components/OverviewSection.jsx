import React, { useEffect, useMemo, useState } from 'react'
import {
  ListChecks, Clock, AlertTriangle, CalendarClock, Flame, Timer, CheckSquare,
  Plus, CalendarDays, Settings as SettingsIcon, CheckCircle2, Circle, Play,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPlans, subscribeToTasks, toggleTask } from '../services/planService'
import { subscribeToCapacitySettings, subscribeToOverrides } from '../services/capacityService'
import { useFocusStats } from '../hooks/useFocusStats'
import { allocateSchedule, toDateStr } from '../utils/scheduler'
import { computeStatus, TONE_CLASSES } from '../utils/planStatus'
import { remainingMinutesForTask } from '../utils/progress'
import { formatMins, daysLeftInfo } from '../utils/format'
import { friendlyFirestoreError } from '../utils/errors'
import PriorityDot from './PriorityDot'

const todayStr = () => toDateStr(new Date())

const QuickStat = ({ icon: Icon, label, value }) => (
  <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <div className="text-base font-bold text-foreground leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1 truncate">{label}</div>
    </div>
  </div>
)

const OverviewSection = ({ onNavigate, onStartFocus }) => {
  const { user } = useAuth()

  const [plans, setPlans] = useState([])
  const [plansLoaded, setPlansLoaded] = useState(false)
  const [tasksByPlan, setTasksByPlan] = useState({})
  const [loadedPlanIds, setLoadedPlanIds] = useState(new Set())
  const [defaultHours, setDefaultHours] = useState(4)
  const [overrides, setOverrides] = useState({})
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user) return
    const unsub1 = subscribeToPlans(user.uid, (p) => { setPlans(p); setPlansLoaded(true) })
    const unsub2 = subscribeToCapacitySettings(user.uid, setDefaultHours)
    const unsub3 = subscribeToOverrides(user.uid, setOverrides)
    return () => { unsub1(); unsub2(); unsub3() }
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

  useEffect(() => {
    if (!actionError) return
    const t = setTimeout(() => setActionError(''), 4000)
    return () => clearTimeout(t)
  }, [actionError])

  const planIds = useMemo(() => new Set(plans.map((p) => p.id)), [plans])
  const planById = useMemo(() => Object.fromEntries(plans.map((p) => [p.id, p])), [plans])
  const allTasks = useMemo(
    () => Object.entries(tasksByPlan).filter(([planId]) => planIds.has(planId)).flatMap(([, tasks]) => tasks),
    [tasksByPlan, planIds]
  )
  const loading = !plansLoaded || (plans.length > 0 && !plans.every((p) => loadedPlanIds.has(p.id)))

  const { currentStreak, sessionsThisWeek } = useFocusStats(user, allTasks)

  const { schedule } = useMemo(() => {
    const plansWithTasks = plans.map((plan) => ({
      ...plan,
      tasks: allTasks.filter((t) => t.planId === plan.id),
    }))
    return allocateSchedule({ plans: plansWithTasks, defaultHours, overrides, today: new Date() })
  }, [plans, allTasks, defaultHours, overrides])

  const today = todayStr()
  const todaysDay = schedule.find((d) => d.date === today)
  const todaysItems = todaysDay?.items ?? []

  const incompleteTasks = allTasks.filter((t) => !t.done)
  const remainingMinutes = incompleteTasks.reduce((sum, t) => sum + remainingMinutesForTask(t), 0)

  const todaysTasks = useMemo(() => todaysItems.map((t) => ({ ...t, done: !!t.done })), [todaysItems])
  const topTask = todaysTasks.find((t) => !t.done)
  const todaysCompletionRate = todaysTasks.length
    ? Math.round((todaysTasks.filter((t) => t.done).length / todaysTasks.length) * 100)
    : 0

  const highPriorityTasks = useMemo(() => (
    incompleteTasks
      .filter((t) => t.priority === 'high')
      .map((t) => ({ ...t, plan: planById[t.planId] }))
      .filter((t) => t.plan)
      .sort((a, b) => (a.plan.deadline || '').localeCompare(b.plan.deadline || ''))
      .slice(0, 5)
  ), [incompleteTasks, planById])

  const plansWithStatus = useMemo(() => (
    plans.map((plan) => {
      const tasks = allTasks.filter((t) => t.planId === plan.id)
      return { plan, status: computeStatus(plan, tasks) }
    })
  ), [plans, allTasks])

  const atRiskPlans = useMemo(
    () => plansWithStatus.filter((p) => p.status.tone === 'amber' || p.status.tone === 'rose'),
    [plansWithStatus]
  )

  const upcomingDeadlines = useMemo(() => (
    plansWithStatus
      .filter((p) => p.status.label !== 'Completed')
      .map((p) => p.plan)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5)
  ), [plansWithStatus])

  // Shared by every checkbox on this page — a failed write shows a real
  // reason instead of silently doing nothing.
  const handleToggle = async (task) => {
    setActionError('')
    try {
      await toggleTask(user.uid, task.planId, task.id, !task.done)
    } catch (err) {
      console.error(err)
      setActionError(friendlyFirestoreError(err))
    }
  }

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">What should you work on today?</p>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <OverviewSkeleton />
      ) : plans.length === 0 ? (
        <EmptyOverview onNavigate={onNavigate} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Today's Focus */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm p-6">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Today's Focus</div>
              {topTask ? (
                <>
                  <h2 className="text-xl font-bold text-foreground mb-1 leading-tight">{topTask.title}</h2>
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: topTask.planColor }} />
                    <span className="text-sm text-muted-foreground">{topTask.planName}</span>
                    <span className="text-border mx-1">·</span>
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formatMins(topTask.minutes ?? topTask.estMinutes)} estimated</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => onStartFocus(topTask)}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Focus Session
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {todaysTasks.filter((t) => !t.done).length} tasks · {formatMins(remainingMinutes)} remaining
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 mt-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span className="text-lg font-semibold text-emerald-600">All done for today — great work.</span>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-rows-3 gap-3">
              <QuickStat icon={Flame} label="Consistency streak" value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`} />
              <QuickStat icon={Timer} label="Sessions this week" value={sessionsThisWeek} />
              <QuickStat icon={CheckSquare} label="Completion rate" value={`${todaysCompletionRate}%`} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Today's Plan */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Today's Plan</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">No fixed times · estimated effort only</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{todaysItems.length} scheduled</span>
              </div>
              {todaysTasks.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Nothing scheduled for today. Check the Planner to see your upcoming workload.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {todaysTasks.map((task) => (
                    <div
                      key={task.key || task.id}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-muted/60 transition-colors ${task.done ? 'opacity-50' : ''}`}
                    >
                      <button onClick={() => handleToggle(task)} className="shrink-0">
                        {task.done
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <Circle className="w-5 h-5 text-border" />}
                      </button>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.planColor }} />
                      <span className={`flex-1 min-w-0 truncate text-sm ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                        {task.isSplit && <span className="ml-1.5 text-[10px] text-muted-foreground align-middle">(part)</span>}
                      </span>
                      <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">{task.planName}</span>
                      <PriorityDot priority={task.priority} />
                      <span className="text-xs text-muted-foreground shrink-0">{formatMins(task.minutes ?? task.estMinutes)}</span>
                      {!task.done && (
                        <button
                          onClick={() => onStartFocus(task)}
                          title="Start a focus session on this task"
                          className="shrink-0 p-1.5 rounded-lg text-primary hover:bg-accent transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: at-risk plans + deadlines */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-foreground">Plans at risk</h3>
                </div>
                {atRiskPlans.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-muted-foreground">All plans are on track.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {atRiskPlans.map(({ plan, status }) => (
                      <button
                        key={plan.id}
                        onClick={() => onNavigate('plans')}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/60 transition-colors text-left"
                      >
                        <span className="text-sm text-foreground truncate">{plan.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${TONE_CLASSES[status.tone]}`}>
                          {status.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Upcoming deadlines</h3>
                </div>
                {upcomingDeadlines.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-muted-foreground">No active deadlines.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {upcomingDeadlines.map((plan) => {
                      const { label, urgent } = daysLeftInfo(plan.deadline)
                      return (
                        <button
                          key={plan.id}
                          onClick={() => onNavigate('plans')}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/60 transition-colors text-left"
                        >
                          <span className="text-sm text-foreground truncate">{plan.name}</span>
                          <span className={`text-xs shrink-0 ${urgent ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* High-priority tasks, across all plans */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mt-5">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-foreground">High-priority tasks</h3>
            </div>
            {highPriorityTasks.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-muted-foreground">No high-priority tasks outstanding.</div>
            ) : (
              <div className="divide-y divide-border">
                {highPriorityTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/60 transition-colors">
                    <button onClick={() => handleToggle(task)} className="shrink-0">
                      <Circle className="w-5 h-5 text-border" />
                    </button>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.plan.color }} />
                    <span className="flex-1 min-w-0 truncate text-sm text-foreground">{task.title}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">{task.plan.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatMins(remainingMinutesForTask(task))}</span>
                    <button
                      onClick={() => onStartFocus(task)}
                      title="Start a focus session on this task"
                      className="shrink-0 p-1.5 rounded-lg text-primary hover:bg-accent transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigate('plans')}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> New plan
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="flex items-center gap-2 bg-muted text-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-accent transition-colors"
            >
              <CalendarDays className="w-4 h-4" /> Open planner
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 bg-muted text-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-accent transition-colors"
            >
              <SettingsIcon className="w-4 h-4" /> Adjust capacity
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Loading skeleton so the empty state doesn't flash while Firestore
// subscriptions are still connecting ──
const OverviewSkeleton = () => (
  <div className="animate-pulse space-y-5">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 h-40 rounded-2xl bg-muted" />
      <div className="grid grid-rows-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-full rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
    <div className="h-56 rounded-2xl bg-muted" />
  </div>
)

const EmptyOverview = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
      <ListChecks className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">Nothing to show yet</h3>
    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
      Create your first plan and add some tasks — your overview will fill in automatically.
    </p>
    <button
      onClick={() => onNavigate('plans')}
      className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"
    >
      Create a plan
    </button>
  </div>
)

export default OverviewSection