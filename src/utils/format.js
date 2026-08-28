export const formatMins = (m) => {
  if (!m || m <= 0) return '0 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

export const daysLeftInfo = (deadline) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline + 'T00:00:00')
  const days = Math.round((due - today) / 86400000)

  if (days < 0) return { days, label: 'Overdue', urgent: true }
  if (days === 0) return { days, label: 'Due today', urgent: true }
  if (days === 1) return { days, label: 'Due tomorrow', urgent: true }
  return { days, label: `${days} days left`, urgent: days <= 3 }
}