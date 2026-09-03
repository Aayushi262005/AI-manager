import React, { useEffect, useState } from 'react'
import { ChevronLeft, CheckCircle2, Circle, Clock, Plus, Trash2, CheckSquare, Pencil, Play, ChevronDown, FileText, Link2, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToTasks, createTask, toggleTask, deleteTask, updatePlan } from '../services/planService'
import {
  subscribeToKnowledge, createNote, createLink,
  togglePin, deleteResource, updateNote,
} from '../services/knowledgeService'
import { formatMins, daysLeftInfo } from '../utils/format'
import { computeStatus, TONE_CLASSES } from '../utils/planStatus'
import { taskProgressPct, planProgressPct, remainingMinutesForTask } from '../utils/progress'
import PriorityDot from './PriorityDot'
import AddTaskModal from './AddTaskModal'
import EditPlanModal from './EditPlanModal'
import KnowledgeItemRow from './KnowledgeItemRow'
import QuickAddLinkPopover from './QuickAddLinkPopover'
import NoteEditor from './NoteEditor'
import { friendlyFirestoreError } from '../utils/errors'

const TaskRow = ({ task, dimmed, onToggle, onDelete, onStartFocus }) => {
  const pct = taskProgressPct(task)
  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/60 transition-colors group ${dimmed ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(task)} className="shrink-0" title={task.done ? 'Mark incomplete' : 'Mark complete'}>
        {task.done
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          : <Circle className="w-5 h-5 text-border" />}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`block truncate text-sm ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </span>
        {!task.done && pct > 0 && (
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5 max-w-[140px]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {!task.done && pct > 0 && <span className="text-[11px] font-medium text-primary">{pct}%</span>}
        <PriorityDot priority={task.priority} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {formatMins(task.estMinutes)}
        </div>
        {!task.done && (
          <button
            onClick={() => onStartFocus(task)}
            title="Start a focus session on this task"
            className="p-1 rounded-lg text-primary hover:bg-accent transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

const TaskGroup = ({ label, items, dimmed, onToggle, onDelete, onStartFocus }) => {
  if (items.length === 0) return null
  return (
    <>
      <div className="px-5 py-2 bg-background border-b border-border">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {label} · {items.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {items.map((t) => (
          <TaskRow key={t.id} task={t} dimmed={dimmed} onToggle={onToggle} onDelete={onDelete} onStartFocus={onStartFocus} />
        ))}
      </div>
    </>
  )
}

const KnowledgeGroup = ({ label, items, onTogglePin, onDelete, onOpen }) => {
  if (items.length === 0) return null
  return (
    <>
      {label && (
        <div className="px-5 py-2 bg-background border-b border-border">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
      )}
      <div className="divide-y divide-border">
        {items.map((r) => (
          <KnowledgeItemRow key={r.id} resource={r} onTogglePin={onTogglePin} onDelete={onDelete} onOpenNote={onOpen} />
        ))}
      </div>
    </>
  )
}

const PlanDetail = ({ plan, onBack, onStartFocus }) => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditPlan, setShowEditPlan] = useState(false)
  const [actionError, setActionError] = useState('')

  const [knowledge, setKnowledge] = useState([])
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [viewingNote, setViewingNote] = useState(null)
  const [isNewNote, setIsNewNote] = useState(false)

  useEffect(() => {
    if (!user || !plan?.id) return
    const unsubscribe = subscribeToTasks(user.uid, plan.id, setTasks)
    return () => unsubscribe()
  }, [user, plan?.id])

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToKnowledge(user.uid, setKnowledge)
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!viewingNote) return
    const latest = knowledge.find((r) => r.id === viewingNote.id)
    if (!latest) setViewingNote(null)
    else if (latest !== viewingNote) setViewingNote(latest)
  }, [knowledge, viewingNote])

  useEffect(() => {
    if (!actionError) return
    const t = setTimeout(() => setActionError(''), 4000)
    return () => clearTimeout(t)
  }, [actionError])

  const doneTasks = tasks.filter((t) => t.done)
  const todoTasks = tasks.filter((t) => !t.done)
  const progressPct = planProgressPct(tasks)
  const remainingMins = todoTasks.reduce((sum, t) => sum + remainingMinutesForTask(t), 0)
  const { days } = daysLeftInfo(plan.deadline)
  const status = computeStatus(plan, tasks)

  const planKnowledge = knowledge.filter((r) => r.planId === plan.id)
  const pinnedKnowledge = planKnowledge.filter((r) => r.pinned)
  const recentKnowledge = planKnowledge.filter((r) => !r.pinned)

  const handleToggle = async (task) => {
    setActionError('')
    try {
      await toggleTask(user.uid, plan.id, task.id, !task.done)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }
  const handleDeleteTask = async (taskId) => {
    setActionError('')
    try {
      await deleteTask(user.uid, plan.id, taskId)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }
  const handleAddTask = (data) => createTask(user.uid, plan.id, data)
  const handleUpdatePlan = (data) => updatePlan(user.uid, plan.id, data)
  const handleStartFocus = (task) => onStartFocus({ ...task, planId: plan.id })

  const handleCreateNote = async () => {
    setAddMenuOpen(false)
    try {
      const ref = await createNote(user.uid, { title: '', body: '', planId: plan.id })
      setIsNewNote(true)
      setViewingNote({ id: ref.id, type: 'note', title: '', body: '', planId: plan.id, pinned: false, updatedAt: null })
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }
  const handleSaveLink = (payload) => createLink(user.uid, { ...payload, planId: plan.id })
  const handleTogglePinResource = async (resource) => {
    try {
      await togglePin(user.uid, resource.id, !resource.pinned)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }
  const handleDeleteResource = async (resource) => {
    try {
      await deleteResource(user.uid, resource)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }
  const handleSaveNote = ({ title, body }) => updateNote(user.uid, viewingNote.id, { title, body })
  const handleOpenResource = (resource) => {
    setIsNewNote(false)
    setViewingNote(resource)
  }

  return (
    <div className="flex-1 p-6 sm:p-7 max-w-[900px] mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to plans
      </button>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-5">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(to right, ${plan.color}, ${plan.color}80)` }}
        />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0"
              style={{ backgroundColor: plan.color }}
            >
              {plan.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              {plan.description && <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>}
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${TONE_CLASSES[status.tone]}`}>
              {status.label}
            </span>
            <button
              onClick={() => setShowEditPlan(true)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Edit plan"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-bold" style={{ color: plan.color }}>{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: plan.color }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Tasks', value: `${doneTasks.length}/${tasks.length}` },
              { label: 'Days left', value: days < 0 ? 'Overdue' : days },
              { label: 'Remaining', value: remainingMins ? formatMins(remainingMins) : '—' },
            ].map((s) => (
              <div key={s.label} className="bg-background rounded-xl py-3">
                <div className="text-sm font-bold text-foreground">{s.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center border-b border-border mb-4">
        {['tasks', 'progress', 'knowledge'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-3">
                <CheckSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add tasks to start executing on this plan.</p>
            </div>
          ) : (
            <>
              <TaskGroup label="To Do" items={todoTasks} onToggle={handleToggle} onDelete={handleDeleteTask} onStartFocus={handleStartFocus} />
              <TaskGroup label="Done" items={doneTasks} dimmed onToggle={handleToggle} onDelete={handleDeleteTask} />
            </>
          )}
          <div className="px-5 py-3 border-t border-border">
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add task to this plan
            </button>
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Done', value: doneTasks.length, color: '#10B981', bg: 'bg-emerald-50' },
              { label: 'To Do', value: todoTasks.length, color: '#9CA3AF', bg: 'bg-gray-50' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border border-border p-5 text-center ${s.bg}`}>
                <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {tasks.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-foreground mb-4">Task progress</h4>
              <div className="space-y-3">
                {tasks.map((t) => {
                  const pct = taskProgressPct(t)
                  return (
                    <div key={t.id}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="truncate">{t.title}</span>
                        <span className="ml-2 flex-shrink-0 font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#10B981' : plan.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              {planKnowledge.length} {planKnowledge.length === 1 ? 'resource' : 'resources'} in this plan
            </span>
            <div className="relative">
              <button
                onClick={() => setAddMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-primary px-3 py-1.5 rounded-lg hover:bg-accent/70 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add resource <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {addMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    <button
                      type="button"
                      onClick={handleCreateNote}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-primary" /> New note
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddMenuOpen(false); setLinkPopoverOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left border-t border-border"
                    >
                      <Link2 className="w-4 h-4 text-blue-500" /> New link
                    </button>
                  </div>
                </>
              )}
              {linkPopoverOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLinkPopoverOpen(false)} />
                  <QuickAddLinkPopover plans={[plan]} onClose={() => setLinkPopoverOpen(false)} onSave={handleSaveLink} />
                </>
              )}
            </div>
          </div>

          {planKnowledge.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No notes or links yet</p>
              <p className="text-xs text-muted-foreground mt-1">Save resources here as you work through this plan.</p>
            </div>
          ) : (
            <>
              <KnowledgeGroup label="Pinned" items={pinnedKnowledge} onTogglePin={handleTogglePinResource} onDelete={handleDeleteResource} onOpen={handleOpenResource} />
              <KnowledgeGroup items={recentKnowledge} onTogglePin={handleTogglePinResource} onDelete={handleDeleteResource} onOpen={handleOpenResource} />
            </>
          )}
        </div>
      )}

      {viewingNote && (
        <NoteEditor
          resource={viewingNote}
          planName={plan.name}
          isNew={isNewNote}
          onClose={() => { setViewingNote(null); setIsNewNote(false) }}
          onSave={handleSaveNote}
          onDelete={handleDeleteResource}
          onTogglePin={handleTogglePinResource}
        />
      )}

      {showAddTask && (
        <AddTaskModal onClose={() => setShowAddTask(false)} onSave={handleAddTask} />
      )}

      {showEditPlan && (
        <EditPlanModal plan={plan} onClose={() => setShowEditPlan(false)} onSave={handleUpdatePlan} />
      )}
    </div>
  )
}

export default PlanDetail