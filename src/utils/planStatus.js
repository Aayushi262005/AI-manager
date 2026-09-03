import { planProgressPct } from './progress'

export const computeStatus = (plan, tasks) => {
  if (tasks.length === 0) return { label: 'Not started', tone: 'gray' }

  const progressPct = planProgressPct(tasks)
  if (progressPct >= 100) return { label: 'Completed', tone: 'emerald' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(plan.deadline + 'T00:00:00')
  if (today > due) return { label: 'Overdue', tone: 'rose' }
  const created = plan.createdAt?.toDate ? plan.createdAt.toDate() : new Date()
 
  const totalMs = due - created
  const elapsedMs = new Date() - created
  const expectedPct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0

  if (progressPct + 10 >= expectedPct) return { label: 'On Track', tone: 'emerald' }
  return { label: 'At Risk', tone: 'amber' }
}

export const TONE_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  gray: 'bg-muted text-muted-foreground',
}