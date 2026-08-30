import React, { useEffect, useState } from 'react'
import { Clock, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToCapacitySettings, setDefaultCapacity, setDayOverride, getDayOverride } from '../services/capacityService'
import { toDateStr } from '../utils/scheduler'

const todayStr = () => toDateStr(new Date())

const CapacitySettings = () => {
  const { user } = useAuth()
  const [defaultHours, setDefaultHours] = useState(4)
  const [savedHours, setSavedHours] = useState(4)
  const [saving, setSaving] = useState(false)

  const [todayOverride, setTodayOverride] = useState('')
  const [savingToday, setSavingToday] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToCapacitySettings(user.uid, (hours) => {
      setDefaultHours(hours)
      setSavedHours(hours)
    })
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user) return
    getDayOverride(user.uid, todayStr()).then((hours) => {
      if (hours !== null) setTodayOverride(String(hours))
    })
  }, [user])

  const handleSaveDefault = async () => {
    setSaving(true)
    try {
      await setDefaultCapacity(user.uid, Number(defaultHours))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveToday = async () => {
    if (todayOverride === '') return
    setSavingToday(true)
    try {
      await setDayOverride(user.uid, todayStr(), Number(todayOverride))
    } finally {
      setSavingToday(false)
    }
  }

  const hasUnsavedChanges = Number(defaultHours) !== savedHours

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden m-5">
      <div className="absolute top-0 left-10 right-10 h-[2px] rounded-b-full bg-gradient-to-r from-primary/50 to-chart-2/50" />

      <div className="px-8 py-6 border-b border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-muted-foreground" /> Study capacity
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
          How many hours can you realistically study on a normal day? This is what keeps your plans honest instead of ideal.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 border-b border-border">
        <div className="max-w-sm">
          <div className="text-sm font-medium text-foreground">Default daily capacity</div>
          <div className="text-sm text-muted-foreground mt-0.5">Used for every day, unless you override a specific one below.</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={defaultHours}
              onChange={(e) => setDefaultHours(e.target.value)}
              className="w-28 px-4 py-2.5 text-base font-medium bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-center"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">hrs</span>
          </div>
          <button
            onClick={handleSaveDefault}
            disabled={saving || !hasUnsavedChanges}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
          >
            {saving ? 'Saving…' : hasUnsavedChanges ? 'Save' : <><Check className="w-4 h-4" /> Saved</>}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6">
        <div className="max-w-sm">
          <div className="text-sm font-medium text-foreground">Just for today</div>
          <div className="text-sm text-muted-foreground mt-0.5">Unusually busy or unusually free? Override only today's number.</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="16"
              step="0.5"
              placeholder={String(defaultHours)}
              value={todayOverride}
              onChange={(e) => setTodayOverride(e.target.value)}
              className="w-28 px-4 py-2.5 text-base font-medium bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-center"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">hrs</span>
          </div>
          <button
            onClick={handleSaveToday}
            disabled={savingToday || todayOverride === ''}
            className="px-5 py-2.5 bg-accent text-primary text-sm font-semibold rounded-xl hover:bg-accent/70 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {savingToday ? 'Saving…' : 'Set for today'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CapacitySettings