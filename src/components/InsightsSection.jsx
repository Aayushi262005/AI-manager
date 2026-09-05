import React, { useMemo, useState } from 'react'
import { CheckCircle2, Percent, Clock, Timer, HeartPulse, Flame, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPlans, subscribeToTasks } from '../services/planService'
import { useFocusStats } from '../hooks/useFocusStats'
import { computeStatus, TONE_CLASSES } from '../utils/planStatus'
import { toDateStr } from '../utils/scheduler'
import { formatMins } from '../utils/format'

const HEALTH_LABEL_ORDER = ['On Track', 'At Risk', 'Overdue', 'Completed', 'Not started']

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center mb-3">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
    {sub && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>}
  </div>
)

const InsightsSection = ({ onNavigate }) => {
  const { user } = useAuth()

  const [plans, setPlans] = useState([])
  const [plansLoaded, setPlansLoaded] = useState(false)
  const [tasksByPlan, setTasksByPlan] = useState({})
  const [loadedPlanIds, setLoadedPlanIds] = useState(new Set())
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0)

  React.useEffect(() => {
    if (!user) return
    const unsub = subscribeToPlans(
      user.uid,
      (p) => { setPlans(p); setPlansLoaded(true) },
    )
    return () => unsub()
  }, [user])

  React.useEffect(() => {
    if (!user || plans.length === 0) return
    const unsubs = plans.map((plan) =>
      subscribeToTasks(user.uid, plan.id, (tasks) => {
        setTasksByPlan((prev) => ({ ...prev, [plan.id]: tasks.map((t) => ({ ...t, planId: plan.id })) }))
        setLoadedPlanIds((prev) => new Set(prev).add(plan.id))
      })
    )
    return () => unsubs.forEach((u) => u())
  }, [user, plans])

  const planIds = useMemo(() => new Set(plans.map((p) => p.id)), [plans])
  const allTasks = useMemo(
    () => Object.entries(tasksByPlan).filter(([planId]) => planIds.has(planId)).flatMap(([, tasks]) => tasks),
    [tasksByPlan, planIds]
  )

  const {
    sessionsLoaded, sessionsError, totalFocusMinutes, sessionCount, avgSessionMinutes,
    minutesByDay, currentStreak, bestStreak,
  } = useFocusStats(user, allTasks)

  const loading = !plansLoaded || !sessionsLoaded || (plans.length > 0 && !plans.every((p) => loadedPlanIds.has(p.id)))

  // ── Core stats ──
  const totalTasks = allTasks.length
  const doneCount = allTasks.filter((t) => t.done).length
  const completionRate = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0

  // ── Weekly progress: focus minutes per day, last 7 days including today ──
  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ dateStr: toDateStr(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return days
  }, [])

  const weeklyData = last7Days.map((d) => ({ ...d, minutes: minutesByDay[d.dateStr] || 0 }))
  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 1)

  // ── Monthly streak strip: every day of the viewed month, colored by
  // whether a focus session happened that day. calendarMonthOffset is 0
  // for the current month, -1 for last month, etc. — you can browse back,
  // but never past the current month. ──
  const calendarMonth = useMemo(() => {
    const today = new Date()
    const base = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayStr = toDateStr(today)

    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStr(new Date(year, month, day))
      days.push({
        day,
        dateStr,
        minutes: minutesByDay[dateStr] || 0,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      })
    }

    return {
      label: base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      days,
      activeCount: days.filter((d) => !d.isFuture && d.minutes > 0).length,
    }
  }, [calendarMonthOffset, minutesByDay])

  // ── Plan health: reuses the exact same computeStatus used for At Risk
  // detection everywhere else — Insights can't disagree with Overview ──
  const healthBreakdown = useMemo(() => {
    const byLabel = {}
    plans.forEach((plan) => {
      const tasks = allTasks.filter((t) => t.planId === plan.id)
      const status = computeStatus(plan, tasks)
      if (!byLabel[status.label]) byLabel[status.label] = { label: status.label, tone: status.tone, count: 0 }
      byLabel[status.label].count += 1
    })
    return HEALTH_LABEL_ORDER.map((label) => byLabel[label]).filter(Boolean)
  }, [plans, allTasks])

  // ── Deadline confidence: share of plans that are On Track or already
  // Completed, out of everything that isn't "Not started" yet. Plans with
  // no tasks yet don't count against you — there's nothing to be at risk
  // of failing until you've actually started scheduling work. ──
  const confidenceEligible = healthBreakdown.filter((h) => h.label !== 'Not started')
  const confidenceEligibleCount = confidenceEligible.reduce((sum, h) => sum + h.count, 0)
  const onTrackCount = healthBreakdown
    .filter((h) => h.label === 'On Track' || h.label === 'Completed')
    .reduce((sum, h) => sum + h.count, 0)
  const deadlineConfidence = confidenceEligibleCount ? Math.round((onTrackCount / confidenceEligibleCount) * 100) : null

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">How you're actually executing, based on real activity</p>
      </div>

      {sessionsError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-rose-700">
          Focus session data couldn't be loaded ({sessionsError}). Other stats below are still accurate.
        </div>
      )}

      {loading ? (
        <InsightsSkeleton />
      ) : plans.length === 0 ? (
        <EmptyInsights onNavigate={onNavigate} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
            <StatCard
              icon={CheckCircle2}
              label="Tasks completed"
              value={doneCount}
              sub={`of ${totalTasks} total`}
            />
            <StatCard
              icon={Percent}
              label="Completion rate"
              value={`${completionRate}%`}
              sub="across all plans"
            />
            <StatCard
              icon={Clock}
              label="Total focus time"
              value={formatMins(totalFocusMinutes)}
              sub={sessionCount ? `avg ${formatMins(avgSessionMinutes)}/session` : 'no sessions yet'}
            />
            <StatCard
              icon={Timer}
              label="Focus sessions"
              value={sessionCount}
              sub="completed"
            />
            <StatCard
              icon={Flame}
              label="Study streak"
              value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
              sub={bestStreak > currentStreak ? `best ${bestStreak}` : currentStreak > 0 ? 'personal best!' : 'start today'}
            />
            <StatCard
              icon={ShieldCheck}
              label="Deadline confidence"
              value={deadlineConfidence === null ? '—' : `${deadlineConfidence}%`}
              sub={deadlineConfidence === null ? 'no active plans yet' : 'plans on track or done'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Weekly progress */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Weekly focus time</h3>
              {sessionCount === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No focus sessions yet. Start one from a task in Overview or a Plan to see your trend here.
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2 h-32 px-1">
                  {weeklyData.map((d) => (
                    <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end justify-center h-24">
                        <div
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-primary to-chart-2 transition-all"
                          style={{ height: d.minutes > 0 ? `${Math.max(8, (d.minutes / maxMinutes) * 100)}%` : '2px' }}
                          title={`${d.label}: ${formatMins(d.minutes)}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Plan health */}
              <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <HeartPulse className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Plan health</h3>
                </div>
                {healthBreakdown.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No plans yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {healthBreakdown.map((h) => (
                      <div key={h.label} className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${TONE_CLASSES[h.tone]}`}>
                          {h.label}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{h.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consistency streak — monthly view, sized to match the card above */}
              <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-foreground">Consistency streak</h4>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setCalendarMonthOffset((o) => o - 1)}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCalendarMonthOffset((o) => Math.min(0, o + 1))}
                      disabled={calendarMonthOffset === 0}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Next month"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {currentStreak} <span className="text-base text-muted-foreground font-normal">{currentStreak === 1 ? 'day' : 'days'}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  You showed up {currentStreak} {currentStreak === 1 ? 'day' : 'days'} in a row. Best: {bestStreak}.
                </p>
                <div className="flex items-center gap-1">
                  {calendarMonth.days.map((d) => (
                    <div
                      key={d.dateStr}
                      title={d.isFuture ? d.dateStr : `${d.dateStr}: ${formatMins(d.minutes)}`}
                      className={`flex-1 h-4 rounded-sm ${
                        d.isFuture ? 'bg-transparent border border-dashed border-border' :
                        d.minutes > 0 ? 'bg-primary' : 'bg-muted'
                      } ${d.isToday ? 'ring-2 ring-primary/50' : ''}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{calendarMonth.label} · {calendarMonth.activeCount} active days</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const InsightsSkeleton = () => (
  <div className="animate-pulse space-y-5">
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-muted" />
      ))}
    </div>
    <div className="h-56 rounded-2xl bg-muted" />
  </div>
)

const EmptyInsights = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
      <Timer className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">No data yet</h3>
    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
      Create a plan, add some tasks, and run a focus session — your real execution data will show up here.
    </p>
    <button
      onClick={() => onNavigate('plans')}
      className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"
    >
      Create a plan
    </button>
  </div>
)

export default InsightsSection