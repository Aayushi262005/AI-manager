import React, { useState } from 'react'
import { X } from 'lucide-react'
import AddTaskModal from './AddTaskModal'

const NewTaskFlow = ({ plans, onClose, onCreate }) => {
  const [planId, setPlanId] = useState(plans.length === 1 ? plans[0].id : null)

  if (plans.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-foreground mb-1.5">Create a plan first</h2>
          <p className="text-sm text-muted-foreground mb-5">Tasks live inside a plan — set one up, then you can add tasks to it.</p>
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  if (planId) {
    return <AddTaskModal onClose={onClose} onSave={(data) => onCreate(planId, data)} />
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Add task to…</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto -mx-1.5 space-y-1">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanId(p.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NewTaskFlow