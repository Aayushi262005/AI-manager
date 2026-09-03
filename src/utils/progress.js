export const taskProgressPct = (task) => {
  if (typeof task.progress === 'number') return task.progress
  return task.done ? 100 : 0
}

export const remainingMinutesForTask = (task) => {
  const pct = taskProgressPct(task)
  const est = task.estMinutes || 0
  if (pct <= 0) return est
  if (pct >= 100) return 0
  return Math.round(est * (1 - pct / 100))
}

export const planProgressPct = (tasks) => {
  if (!tasks.length) return 0
  const totalEst = tasks.reduce((sum, t) => sum + (t.estMinutes || 0), 0)
  if (totalEst === 0) return 0
  const doneWeighted = tasks.reduce(
    (sum, t) => sum + (t.estMinutes || 0) * (taskProgressPct(t) / 100),
    0
  )
  return Math.round((doneWeighted / totalEst) * 100)
}