import React, { useEffect, useState } from 'react'
import { ChevronLeft, CheckCircle2, Circle, Clock, Plus, Trash2, CheckSquare, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToTasks, createTask, toggleTask, deleteTask, updatePlan } from '../services/planService'
import { formatMins, daysLeftInfo } from '../utils/format'
import { computeStatus, TONE_CLASSES } from '../utils/planStatus'
import PriorityDot from './PriorityDot'
import AddTaskModal from './AddTaskModal'
import EditPlanModal from './EditPlanModal'

const TaskRow = ({ task, dimmed, onToggle, onDelete }) => (
  <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/60 transition-colors group ${dimmed ? 'opacity-50' : ''}`}>
    <button onClick={() => onToggle(task)} className="flex-shrink-0" title={task.done ? 'Mark incomplete' : 'Mark complete'}>
      {task.done
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        : <Circle className="w-5 h-5 text-border" />}
    </button>

    <span className={`flex-1 min-w-0 truncate text-sm ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
      {task.title}
    </span>

    <div className="flex items-center gap-3 flex-shrink-0">
      <PriorityDot priority={task.priority} />
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" /> {formatMins(task.estMinutes)}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
)

const TaskGroup = ({ label, items, dimmed, onToggle, onDelete }) => {
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
          <TaskRow key={t.id} task={t} dimmed={dimmed} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </>
  )
}

const PlanDetail = ({ plan, onBack }) => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditPlan, setShowEditPlan] = useState(false)

  useEffect(() => {
    if (!user || !plan?.id) return
    const unsubscribe = subscribeToTasks(user.uid, plan.id, setTasks)
    return () => unsubscribe()
  }, [user, plan?.id])

  const doneTasks = tasks.filter((t) => t.done)
  const todoTasks = tasks.filter((t) => !t.done)
  const progressPct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0
  const remainingMins = todoTasks.reduce((sum, t) => sum + (t.estMinutes || 0), 0)
  const { days } = daysLeftInfo(plan.deadline)
  const status = computeStatus(plan, tasks)

  const handleToggle = (task) => toggleTask(user.uid, plan.id, task.id, !task.done)
  const handleDeleteTask = (taskId) => deleteTask(user.uid, plan.id, taskId)
  const handleAddTask = (data) => createTask(user.uid, plan.id, data)
  const handleUpdatePlan = (data) => updatePlan(user.uid, plan.id, data)

  return (
    <div className="flex-1 p-6 sm:p-7 max-w-[900px] mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to plans
      </button>

      {/* Summary card */}
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
            <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${TONE_CLASSES[status.tone]}`}>
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

      {/* Tabs */}
      <div className="flex items-center border-b border-border mb-4">
        {['tasks', 'progress'].map((tab) => (
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
              <TaskGroup label="To Do" items={todoTasks} onToggle={handleToggle} onDelete={handleDeleteTask} />
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
                {tasks.map((t) => (
                  <div key={t.id}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="truncate">{t.title}</span>
                      <span className="ml-2 flex-shrink-0 font-medium">{t.done ? 100 : 0}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: t.done ? '100%' : '0%', backgroundColor: t.done ? '#10B981' : plan.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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