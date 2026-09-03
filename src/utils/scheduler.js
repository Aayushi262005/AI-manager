import { remainingMinutesForTask } from './progress'

export const toDateStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const daysBetween = (a, b) => Math.round((b - a) / 86400000)

const MIN_SPLIT_MINUTES = 15

/**
 * @param {Array} plans - each: { id, name, color, deadline: "YYYY-MM-DD", tasks: [{id, title, estMinutes, priority, done, pinnedDate?}] }
 * @param {number} defaultHours - fallback daily capacity when no override exists
 * @param {Object} overrides - { "YYYY-MM-DD": hours }
 * @param {Date} today - defaults to right now; passed in explicitly so this function is testable with any date
 * @returns {{ schedule: Array, warnings: Array }}
 */
export const allocateSchedule = ({ plans, defaultHours, overrides = {}, today = new Date() }) => {
  const startOfToday = new Date(today)
  startOfToday.setHours(0, 0, 0, 0)

  const allTasks = []
  plans.forEach((plan) => {
    plan.tasks
      .filter((t) => !t.done)
      .map((t) => ({
        ...t,
        // Original estimate adjusted for progress already made — the
        // scheduler allocates capacity for what's actually left, not what
        // the task originally cost. See utils/progress.js.
        estMinutes: remainingMinutesForTask(t),
        planId: plan.id,
        planName: plan.name,
        planColor: plan.color,
        planDeadline: plan.deadline,
      }))
      // A task can be !done but have 0 minutes remaining (e.g. progress
      // was pushed to 100 without the checkbox being ticked yet) — don't
      // let a zero-length item occupy a slot in the schedule.
      .filter((t) => t.estMinutes > 0)
      .forEach((t) => allTasks.push(t))
  })

  if (allTasks.length === 0) return { schedule: [], warnings: [] }

  const priorityRank = { high: 0, medium: 1, low: 2 }
  const warnings = []

  const pinned = allTasks.filter((t) => t.pinnedDate)
  const unpinned = allTasks.filter((t) => !t.pinnedDate)

  const sortedUnpinned = [...unpinned].sort((a, b) => {
    if (a.planDeadline !== b.planDeadline) return a.planDeadline.localeCompare(b.planDeadline)
    return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1)
  })

  const latestDeadline = plans.reduce((latest, p) => {
    const d = new Date(p.deadline + 'T00:00:00')
    return d > latest ? d : latest
  }, startOfToday)

  const latestPinned = pinned.reduce((latest, t) => {
    const d = new Date(t.pinnedDate + 'T00:00:00')
    return d > latest ? d : latest
  }, startOfToday)

  const horizonEnd = latestPinned > latestDeadline ? latestPinned : latestDeadline
  const horizonDays = Math.max(daysBetween(startOfToday, horizonEnd) + 14, 14)

  const days = []
  const dayIndexByDate = {}
  for (let i = 0; i < horizonDays; i++) {
    const date = addDays(startOfToday, i)
    const dateStr = toDateStr(date)
    const capacityHours = overrides[dateStr] ?? defaultHours
    dayIndexByDate[dateStr] = days.length
    days.push({ date: dateStr, items: [], usedMinutes: 0, capacityMinutes: capacityHours * 60 })
  }

  const chunkKey = (taskId, n) => `${taskId}__${n}`
  ;[...pinned]
    .sort((a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1))
    .forEach((task) => {
      let dateStr = task.pinnedDate
      const pinnedDateObj = new Date(task.pinnedDate + 'T00:00:00')

      if (pinnedDateObj < startOfToday) {
        dateStr = toDateStr(startOfToday)
        warnings.push({
          planId: task.planId,
          planName: task.planName,
          message: `"${task.title}" was pinned to a date that already passed — moved to today.`,
        })
      }

      let idx = dayIndexByDate[dateStr]
      if (idx === undefined) {
        dayIndexByDate[dateStr] = days.length
        idx = days.length
        const capacityHours = overrides[dateStr] ?? defaultHours
        days.push({ date: dateStr, items: [], usedMinutes: 0, capacityMinutes: capacityHours * 60 })
      }

      days[idx].items.push({
        ...task,
        key: chunkKey(task.id, 0),
        minutes: task.estMinutes,
        isSplit: false,
        isPinned: true,
      })
      days[idx].usedMinutes += task.estMinutes
    })

  const queue = sortedUnpinned.map((t) => ({ ...t, remaining: t.estMinutes, chunkIndex: 0 }))

  for (let i = 0; i < days.length && queue.length > 0; i++) {
    const day = days[i]
    for (;;) {
      const remainCap = day.capacityMinutes - day.usedMinutes
      if (remainCap <= 0 || queue.length === 0) break

      const task = queue[0]
      if (task.remaining <= remainCap) {
        day.items.push({
          ...task,
          key: chunkKey(task.id, task.chunkIndex),
          minutes: task.remaining,
          isSplit: task.chunkIndex > 0,
        })
        day.usedMinutes += task.remaining
        queue.shift()
      } else if (remainCap >= MIN_SPLIT_MINUTES) {
        day.items.push({
          ...task,
          key: chunkKey(task.id, task.chunkIndex),
          minutes: remainCap,
          isSplit: true,
        })
        day.usedMinutes += remainCap
        task.remaining -= remainCap
        task.chunkIndex += 1
        break
      } else {
        break
      }
    }
  }

  days.forEach((day) => { day.overCapacity = day.usedMinutes > day.capacityMinutes })

  if (queue.length > 0) {
    const byPlan = {}
    queue.forEach((t) => {
      byPlan[t.planId] = byPlan[t.planId] || { planId: t.planId, planName: t.planName, count: 0, minutes: 0 }
      byPlan[t.planId].count += 1
      byPlan[t.planId].minutes += t.remaining
    })
    Object.values(byPlan).forEach((p) => {
      warnings.push({
        planId: p.planId,
        planName: p.planName,
        message: `${p.planName}: ${p.count} task${p.count > 1 ? 's' : ''} won't fit before the deadline at your current pace.`,
      })
    })
  }

  const lastDateByTaskId = {}
  days.forEach((day) => {
    day.items.forEach((item) => {
      if (!lastDateByTaskId[item.id] || day.date > lastDateByTaskId[item.id]) {
        lastDateByTaskId[item.id] = day.date
      }
    })
  })
  const warnedTaskIds = new Set()
  Object.entries(lastDateByTaskId).forEach(([taskId, lastDate]) => {
    const task = allTasks.find((t) => t.id === taskId)
    if (task && lastDate > task.planDeadline && !warnedTaskIds.has(taskId)) {
      warnedTaskIds.add(taskId)
      warnings.push({
        planId: task.planId,
        planName: task.planName,
        message: `${task.planName}: "${task.title}" is scheduled after its deadline.`,
      })
    }
  })

  return { schedule: days, warnings }
}
