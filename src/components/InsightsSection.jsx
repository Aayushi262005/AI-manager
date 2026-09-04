import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Percent, Clock, Timer, HeartPulse, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPlans, subscribeToTasks } from '../services/planService'
import { subscribeToAllFocusSessions } from '../services/focusService'
import { computeStatus, TONE_CLASSES } from '../utils/planStatus'
import { toDateStr } from '../utils/scheduler'
import { formatMins } from '../utils/format'

// Firestore returns Timestamp instances (with .toDate()) for fields we
// wrote as JS Dates — same conversion pattern already used in
// planStatus.js for plan.createdAt.
const toJsDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  return new Date(value)
}

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
  const [focusSessions, setFocusSessions] = useState([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [sessionsError, setSessionsError] = useState('')

  useEffect(() => {
    if (!user) return
    const unsub1 = subscribeToPlans(
      user.uid,
      (p) => { setPlans(p); setPlansLoaded(true) },
    )
    const unsub2 = subscribeToAllFocusSessions(
      user.uid,
      (sessions) => { setFocusSessions(sessions); setSessionsLoaded(true) },
      (error) => {
        // Never let a failed listener leave the page stuck on the skeleton —
        // show it as "no data" and surface the real error for debugging.
        setSessionsError(error?.message || 'Could not load focus session data.')
        setFocusSessions([])
        setSessionsLoaded(true)
      }
    )
    return () => { unsub1(); unsub2() }
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

  const planIds = useMemo(() => new Set(plans.map((p) => p.id)), [plans])
  const allTasks = useMemo(
    () => Object.entries(tasksByPlan).filter(([planId]) => planIds.has(planId)).flatMap(([, tasks]) => tasks),
    [tasksByPlan, planIds]
  )
  const loading = !plansLoaded || !sessionsLoaded || (plans.length > 0 && !plans.every((p) => loadedPlanIds.has(p.id)))

  // ── Core stats ──
  const totalTasks = allTasks.length
  const doneCount = allTasks.filter((t) => t.done).length
  const completionRate = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const sessionCount = focusSessions.length
  const avgSessionMinutes = sessionCount ? Math.round(totalFocusMinutes / sessionCount) : 0

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

  const minutesByDay = useMemo(() => {
    const map = {}
    focusSessions.forEach((s) => {
      const d = toJsDate(s.endedAt || s.startedAt)
      if (!d) return
      const key = toDateStr(d)
      map[key] = (map[key] || 0) + (s.durationMinutes || 0)
    })
    return map
  }, [focusSessions])

  const weeklyData = last7Days.map((d) => ({ ...d, minutes: minutesByDay[d.dateStr] || 0 }))
  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 1)

  // ── Consistency streak: every distinct calendar day with at least one
  // focus session, walked backward from today to find the current run,
  // and scanned across all history for the longest run ever. ──
  const activeDayStrs = useMemo(() => {
    const set = new Set()
    focusSessions.forEach((s) => {
      const d = toJsDate(s.endedAt || s.startedAt)
      if (d) set.add(toDateStr(d))
    })
    return set
  }, [focusSessions])

  const { currentStreak, bestStreak } = useMemo(() => {
    if (activeDayStrs.size === 0) return { currentStreak: 0, bestStreak: 0 }

    // Don't zero out the streak just because today hasn't happened yet —
    // start from yesterday if today has no session so far.
    let current = 0
    const cursor = new Date()
    if (!activeDayStrs.has(toDateStr(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (activeDayStrs.has(toDateStr(cursor))) {
      current += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    const sortedDays = Array.from(activeDayStrs).sort()
    let best = 1
    let run = 1
    for (let i = 1; i < sortedDays.length; i++) {
      const diffDays = Math.round((new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000)
      run = diffDays === 1 ? run + 1 : 1
      best = Math.max(best, run)
    }
    return { currentStreak: current, bestStreak: Math.max(best, current) }
  }, [activeDayStrs])

  // ── Last 14 days, for the activity strip ──
  const last14Days = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        dateStr: toDateStr(d),
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        isToday: i === 0,
      })
    }
    return days.map((d) => ({ ...d, minutes: minutesByDay[d.dateStr] || 0 }))
  }, [minutesByDay])

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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
          </div>

          {/* 14-day activity strip */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Last 14 days</h3>
            </div>
            <div className="flex items-end justify-between gap-1.5 sm:gap-2">
              {last14Days.map((d) => {
                const intensity =
                  d.minutes === 0 ? 'bg-muted' :
                  d.minutes <= 30 ? 'bg-primary/30' :
                  d.minutes <= 60 ? 'bg-primary/60' : 'bg-primary'
                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={`w-full aspect-square rounded-md ${intensity} ${d.isToday ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-card' : ''}`}
                      title={`${d.dateStr}: ${formatMins(d.minutes)}`}
                    />
                    <span className="text-[9px] text-muted-foreground">{d.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Weekly progress */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm p-5">
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
          </div>
        </>
      )}
    </div>
  )
}

const InsightsSkeleton = () => (
  <div className="animate-pulse space-y-5">
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-muted" />
      ))}
    </div>
    <div className="h-24 rounded-2xl bg-muted" />
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