import React, { useState } from 'react'
import { X } from 'lucide-react'
import { taskProgressPct } from '../utils/progress'
import { formatMins } from '../utils/format'

const FocusCompleteModal = ({ task, durationMinutes, onSave, onDiscard }) => {
  const [progress, setProgress] = useState(taskProgressPct(task))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(progress)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground text-lg">Session complete</h2>
          <button
            onClick={onDiscard}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Discard — don't save this session"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="bg-muted rounded-xl px-4 py-3 mb-5">
          <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">You worked for {formatMins(durationMinutes)}</div>
        </div>

        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
          How much progress did you make?
        </label>
        <div className="flex items-center gap-3 mb-1">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-bold text-foreground w-12 text-right">{progress}%</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          {progress >= 100 ? 'This will mark the task as done.' : 'The task stays open at this progress.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 bg-muted text-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-accent transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save progress'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FocusCompleteModal