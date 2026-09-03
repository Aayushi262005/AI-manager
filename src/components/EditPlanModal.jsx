import React, { useState } from 'react'
import { X } from 'lucide-react'
import ColorSwatchPicker, { PLAN_COLORS } from './ColorSwatchPicker'

const EditPlanModal = ({ plan, onClose, onSave }) => {
  const [name, setName] = useState(plan.name)
  const [deadline, setDeadline] = useState(plan.deadline)
  const [description, setDescription] = useState(plan.description || '')
  const [color, setColor] = useState(plan.color || PLAN_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give your plan a name.')
      return
    }
    if (!deadline) {
      setError('Pick a deadline.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({ name: name.trim(), deadline, description: description.trim(), color })
      onClose()
    } catch (err) {
      setError('Something went wrong — try again.')
      console.error(err)
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Edit plan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Plan name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Color</label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditPlanModal
