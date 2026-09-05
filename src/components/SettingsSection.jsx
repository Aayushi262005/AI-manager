import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, deleteUser } from 'firebase/auth'
import {
  User, Bell, Keyboard, Download, Trash2, Pencil, Check, X, Loader2, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToUserProfile, updateDisplayName, updateNotificationSetting, exportUserData,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/userService'
import { friendlyFirestoreError } from '../utils/errors'
import CapacitySettings from './CapacitySettings'
import AppearanceSettings from './AppearanceSettings'
import Toggle from './Toggle'

const getInitials = (name, email) => {
  if (name) return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (email?.[0] || '?').toUpperCase()
}

const SHORTCUTS = [
  ['Open search', '⌘K'],
  ['New task', '⌘N'],
  ['Start focus session', '⌘F'],
  ['Go to Overview', '⌘1'],
  ['Go to Plans', '⌘2'],
]

const NOTIFICATION_ITEMS = [
  { key: 'dailyReminder', label: 'Daily focus reminder', desc: 'Get reminded to start your first session each day' },
  { key: 'aiInsights', label: 'AI insights', desc: 'Proactive suggestions when your plan needs attention' },
  { key: 'streakAlert', label: 'Streak alerts', desc: 'Be notified when your streak is at risk' },
  { key: 'sessionComplete', label: 'Session completion', desc: 'Notification when a focus session ends' },
]

// Shared card chrome — same "accent line under the top edge" look used by
// CapacitySettings / PlanCard elsewhere in the app (borrowed from the
// Figma PinnedCard component).
const SettingsCard = ({ children }) => (
  <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
    <div className="absolute top-0 left-10 right-10 h-[2px] rounded-b-full bg-gradient-to-r from-primary/50 to-chart-2/50" />
    <div className="px-8 py-6">{children}</div>
  </div>
)

const CardHeading = ({ icon: Icon, children }) => (
  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
    <Icon className="w-4 h-4 text-muted-foreground" /> {children}
  </h3>
)

const ProfileCard = ({ user }) => {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setName(user?.displayName || '') }, [user?.displayName])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Name can\'t be empty.'); return }
    setSaving(true)
    setError('')
    try {
      await updateProfile(user, { displayName: trimmed })
      await updateDisplayName(user.uid, trimmed)
      setEditing(false)
    } catch (err) {
      setError(friendlyFirestoreError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.displayName || '')
    setError('')
    setEditing(false)
  }

  return (
    <SettingsCard>
      <CardHeading icon={User}>Profile</CardHeading>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-lg font-bold shadow-md flex-shrink-0">
          {getInitials(user?.displayName, user?.email)}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
                className="w-full max-w-[220px] px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                placeholder="Your name"
              />
              <button onClick={handleSave} disabled={saving} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={handleCancel} disabled={saving} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="font-semibold text-foreground truncate">{user?.displayName || 'Add your name'}</div>
              <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
              <div className="text-xs text-primary font-medium mt-0.5">Free plan</div>
            </>
          )}
          {error && <div className="text-xs text-destructive mt-1.5">{error}</div>}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border px-4 py-2 rounded-xl hover:border-ring/40 hover:text-primary transition-all flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>
    </SettingsCard>
  )
}

const NotificationsCard = ({ uid, notifications, onToggle, pendingKey }) => (
  <SettingsCard>
    <CardHeading icon={Bell}>Notifications</CardHeading>
    <div className="space-y-5">
      {NOTIFICATION_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
          </div>
          <Toggle
            checked={!!notifications[item.key]}
            disabled={pendingKey === item.key}
            label={item.label}
            onChange={() => onToggle(uid, item.key, !notifications[item.key])}
          />
        </div>
      ))}
    </div>
  </SettingsCard>
)

const ShortcutsCard = () => (
  <SettingsCard>
    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <Keyboard className="w-4 h-4 text-muted-foreground" /> Keyboard shortcuts
    </h3>
    <div className="space-y-2">
      {SHORTCUTS.map(([label, shortcut]) => (
        <div key={label} className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <kbd className="text-xs bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-md font-mono">{shortcut}</kbd>
        </div>
      ))}
    </div>
  </SettingsCard>
)

const DataCard = ({ user }) => {
  const navigate = useNavigate()
  const [exportState, setExportState] = useState('idle') // idle | working | done | error
  const [deleteState, setDeleteState] = useState('idle') // idle | confirming | working | error
  const [deleteError, setDeleteError] = useState('')

  const handleExport = async () => {
    setExportState('working')
    try {
      const data = await exportUserData(user.uid)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `studyit-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setExportState('done')
    } catch (err) {
      console.error(err)
      setExportState('error')
    } finally {
      setTimeout(() => setExportState('idle'), 3000)
    }
  }

  const handleDeleteClick = () => {
    if (deleteState !== 'confirming') { setDeleteState('confirming'); return }
    performDelete()
  }

  const performDelete = async () => {
    setDeleteState('working')
    setDeleteError('')
    try {
      await deleteUser(user)
      navigate('/login')
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login') {
        setDeleteError('For your security, please log out and log back in, then try deleting your account again.')
      } else {
        setDeleteError(err?.message || 'Something went wrong deleting your account.')
      }
      setDeleteState('confirming')
    }
  }

  return (
    <SettingsCard>
      <CardHeading icon={Download}>Data</CardHeading>
      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={exportState === 'working'}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm hover:border-ring/40 hover:bg-accent/40 transition-all group disabled:opacity-60"
        >
          <span className="font-medium text-foreground">
            {exportState === 'working' && 'Preparing your export…'}
            {exportState === 'done' && 'Downloaded ✓'}
            {exportState === 'error' && "Couldn't export — try again"}
            {exportState === 'idle' && 'Export all data'}
          </span>
          {exportState === 'working'
            ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            : <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
        </button>

        <button
          onClick={handleDeleteClick}
          disabled={deleteState === 'working'}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-destructive/20 text-sm hover:border-destructive/50 hover:bg-destructive/5 transition-all group disabled:opacity-60"
        >
          <span className="font-medium text-destructive">
            {deleteState === 'confirming' ? 'Click again to permanently delete' : 'Delete account'}
          </span>
          {deleteState === 'working'
            ? <Loader2 className="w-4 h-4 text-destructive animate-spin" />
            : <Trash2 className="w-4 h-4 text-destructive/60 group-hover:text-destructive transition-colors" />}
        </button>
        {deleteState === 'confirming' && !deleteError && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground px-1 pt-1">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive/70 flex-shrink-0 mt-0.5" />
            This deletes your login — your plans and data stay in the database but you won't be able to sign back in to reach them. This can't be undone.
          </div>
        )}
        {deleteError && (
          <div className="flex items-start gap-2 text-xs text-destructive px-1 pt-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {deleteError}
          </div>
        )}
      </div>
    </SettingsCard>
  )
}

const SettingsSection = ({ theme, onToggleTheme }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATION_SETTINGS)
  const [pendingKey, setPendingKey] = useState('')

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToUserProfile(user.uid, (data) => {
      const stored = data?.settings?.notifications
      // Guard against the legacy boolean shape written before per-toggle
      // notifications existed (see userService.createUserProfileIfNotExists).
      const merged = stored && typeof stored === 'object'
        ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...stored }
        : DEFAULT_NOTIFICATION_SETTINGS
      setNotifications(merged)
    })
    return () => unsubscribe()
  }, [user])

  const handleToggleNotification = async (uid, key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value })) // optimistic
    setPendingKey(key)
    try {
      await updateNotificationSetting(uid, key, value)
    } catch (err) {
      console.error(err)
      setNotifications((prev) => ({ ...prev, [key]: !value })) // revert on failure
    } finally {
      setPendingKey('')
    }
  }

  if (!user) return null

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
      <div className="max-w-2xl space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace preferences</p>
        </div>

        <ProfileCard user={user} />
        <NotificationsCard uid={user.uid} notifications={notifications} onToggle={handleToggleNotification} pendingKey={pendingKey} />
        <AppearanceSettings theme={theme} onToggle={onToggleTheme} />
        <CapacitySettings />
        <ShortcutsCard />
        <DataCard user={user} />

        <p className="text-center text-xs text-muted-foreground/60 pb-2">StudyIt · Built for people who finish what they start</p>
      </div>
    </div>
  )
}

export default SettingsSection