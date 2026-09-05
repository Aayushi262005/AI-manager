import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../config/Firebase'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import PlansSection from '../components/PlansSection'
import PlannerSection from '../components/PlannerSection'
import OverviewSection from '../components/OverviewSection'
import InsightsSection from '../components/InsightsSection'
import KnowledgeSection from '../components/KnowledgeSection'
import SettingsSection from '../components/SettingsSection'
import FocusBar from '../components/FocusBar'
import FocusCompleteModal from '../components/FocusCompleteModal'
import { createFocusSession, updateTaskProgress } from '../services/focusService'
import { friendlyFirestoreError } from '../utils/errors'
import { useTheme } from '../hooks/useTheme'

const PlaceholderSection = ({ title }) => (
  <div className="flex-1 flex items-center justify-center p-10">
    <div className="text-center">
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">This section is coming up in a later step.</p>
    </div>
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newPlanSignal, setNewPlanSignal] = useState(0)
  const [newNoteSignal, setNewNoteSignal] = useState(0)
  const [focusSession, setFocusSession] = useState(null)
  const [completedSession, setCompletedSession] = useState(null)
  const [focusError, setFocusError] = useState('')

  useEffect(() => {
    if (!focusSession) return
    const interval = setInterval(() => {
      setFocusSession((prev) => {
        if (!prev) return prev
        return { ...prev, elapsed: Math.floor((Date.now() - prev.startedAt.getTime()) / 1000) }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [focusSession?.startedAt])

  useEffect(() => {
    if (!focusError) return
    const t = setTimeout(() => setFocusError(''), 4000)
    return () => clearTimeout(t)
  }, [focusError])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const handleStartFocus = (task) => {
    if (focusSession) {
      setFocusError('Finish your current focus session before starting another one.')
      return
    }
    setFocusSession({ task, planId: task.planId, startedAt: new Date(), elapsed: 0 })
  }

  const handleEndFocus = () => {
    if (!focusSession) return
    const endedAt = new Date()
    const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - focusSession.startedAt.getTime()) / 60000))
    setCompletedSession({
      task: focusSession.task,
      planId: focusSession.planId,
      startedAt: focusSession.startedAt,
      endedAt,
      durationMinutes,
    })
    setFocusSession(null)
  }

  const handleSaveProgress = async (progressValue) => {
    const { task, planId, startedAt, endedAt, durationMinutes } = completedSession
    const [sessionResult, progressResult] = await Promise.allSettled([
      createFocusSession(user.uid, planId, task.id, { startedAt, endedAt, durationMinutes }),
      updateTaskProgress(user.uid, planId, task.id, progressValue),
    ])

    if (progressResult.status === 'rejected') {
      console.error(progressResult.reason)
      setFocusError(`Progress wasn't saved: ${friendlyFirestoreError(progressResult.reason)}`)
    } else if (sessionResult.status === 'rejected') {
      console.error(sessionResult.reason)
      setFocusError(`Progress saved, but the session log wasn't: ${friendlyFirestoreError(sessionResult.reason)}`)
    }
    setCompletedSession(null)
  }

  const handleDiscardSession = () => setCompletedSession(null)

  // Global New menu actions
  const handleNewPlan = () => {
    setActiveSection('plans')
    setNewPlanSignal((value) => value + 1)
  }

  const handleNewNote = () => {
    setActiveSection('knowledge')
    setNewNoteSignal((value) => value + 1)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 min-h-0">
        <Header
          activeSection={activeSection}
          onNavigate={setActiveSection}
          onNewPlan={handleNewPlan}
          onNewNote={handleNewNote}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 flex min-h-0">
          {activeSection === 'overview' && <OverviewSection onNavigate={setActiveSection} onStartFocus={handleStartFocus} />}

          {activeSection === 'plans' && (
            <PlansSection
              onStartFocus={handleStartFocus}
              newPlanSignal={newPlanSignal}
            />
          )}

          {activeSection === 'planner' && <PlannerSection />}
          {activeSection === 'insights' && <InsightsSection onNavigate={setActiveSection} />}

          {activeSection === 'knowledge' && (
            <KnowledgeSection newNoteSignal={newNoteSignal} />
          )}

          {activeSection === 'copilot' && <PlaceholderSection title="AI Copilot" />}
          {activeSection === 'settings' && (
            <SettingsSection theme={theme} onToggleTheme={toggleTheme} />
          )}
        </div>
      </main>

      {focusSession && (
        <FocusBar
          task={focusSession.task}
          elapsedSeconds={focusSession.elapsed}
          onEnd={handleEndFocus}
        />
      )}

      {completedSession && (
        <FocusCompleteModal
          task={completedSession.task}
          durationMinutes={completedSession.durationMinutes}
          onSave={handleSaveProgress}
          onDiscard={handleDiscardSession}
        />
      )}
    </div>
  )
}

export default Dashboard