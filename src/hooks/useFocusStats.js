import { useEffect, useMemo, useState } from 'react'
import { subscribeToTaskFocusSessions } from '../services/focusService'
import { toDateStr } from '../utils/scheduler'

const toJsDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  return new Date(value)
}
export const useFocusStats = (user, allTasks) => {
  const [sessionsByTask, setSessionsByTask] = useState({})
  const [loadedTaskIds, setLoadedTaskIds] = useState(new Set())
  const [sessionsError, setSessionsError] = useState('')

  const taskIdsKey = useMemo(
    () => allTasks.map((t) => `${t.planId}/${t.id}`).sort().join('|'),
    [allTasks]
  )

  useEffect(() => {
    if (!user || !taskIdsKey) return
    const entries = taskIdsKey.split('|').map((s) => {
      const [planId, id] = s.split('/')
      return { planId, id }
    })
    const unsubs = entries.map(({ planId, id }) =>
      subscribeToTaskFocusSessions(
        user.uid, planId, id,
        (sessions) => {
          setSessionsByTask((prev) => ({ ...prev, [id]: sessions.map((s) => ({ ...s, taskId: id, planId })) }))
          setLoadedTaskIds((prev) => new Set(prev).add(id))
        },
        (error) => {
          // Never let one failed listener leave the page stuck on the
          // skeleton — show it as "no data" and surface the real error.
          setSessionsError(error?.message || 'Could not load focus session data.')
          setSessionsByTask((prev) => ({ ...prev, [id]: [] }))
          setLoadedTaskIds((prev) => new Set(prev).add(id))
        }
      )
    )
    return () => unsubs.forEach((u) => u())
  }, [user, taskIdsKey])

  const taskIdSet = useMemo(() => new Set(allTasks.map((t) => t.id)), [allTasks])
  const focusSessions = useMemo(
    () => Object.entries(sessionsByTask).filter(([id]) => taskIdSet.has(id)).flatMap(([, sessions]) => sessions),
    [sessionsByTask, taskIdSet]
  )
  const sessionsLoaded = allTasks.length === 0 || allTasks.every((t) => loadedTaskIds.has(t.id))

  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const sessionCount = focusSessions.length
  const avgSessionMinutes = sessionCount ? Math.round(totalFocusMinutes / sessionCount) : 0

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

  // Sessions started in the last 7 days (today included).
  const sessionsThisWeek = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 6)
    cutoff.setHours(0, 0, 0, 0)
    return focusSessions.filter((s) => {
      const d = toJsDate(s.startedAt || s.endedAt)
      return d && d >= cutoff
    }).length
  }, [focusSessions])

  return {
    focusSessions,
    sessionsLoaded,
    sessionsError,
    totalFocusMinutes,
    sessionCount,
    avgSessionMinutes,
    minutesByDay,
    currentStreak,
    bestStreak,
    sessionsThisWeek,
  }
}