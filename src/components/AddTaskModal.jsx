import React, { useState } from 'react'
import { X } from 'lucide-react'

const PRIORITY_STYLES = {
  high: 'bg-rose-50 text-rose-700 border-rose-300',
  medium: 'bg-amber-50 text-amber-700 border-amber-300',
  low: 'bg-gray-100 text-gray-600 border-gray-300',
}

const AddTaskModal = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('')
  const [estMinutes, setEstMinutes] = useState(30)
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), estMinutes: Number(estMinutes), priority })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-foreground text-lg">Add task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Task</label>
            <input
              autoFocus
              placeholder="What needs to get done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Estimated (min)</label>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={estMinutes}
              onChange={(e) => setEstMinutes(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Priority</label>
            <div className="flex gap-2">
              {['high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border-2 ${
                    priority === p ? PRIORITY_STYLES[p] : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add task'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddTaskModal