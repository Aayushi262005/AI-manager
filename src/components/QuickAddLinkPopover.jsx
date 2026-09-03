import React, { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'

const QuickAddLinkPopover = ({ plans, onClose, onSave }) => {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [planId, setPlanId] = useState(plans[0]?.id || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleUrlChange = (value) => {
    setUrl(value)
    if (!title.trim()) {
      try {
        const host = new URL(value.startsWith('http') ? value : `https://${value}`).hostname.replace(/^www\./, '')
        if (host) setTitle(host)
      } catch {
        // Not a valid URL yet — leave the title alone.
      }
    }
  }

  const canSubmit = title.trim() && url.trim() && planId

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || saving) return
    setSaving(true)
    setError('')
    let normalizedUrl = url.trim()
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`
    try {
      await onSave({ type: 'link', title: title.trim(), url: normalizedUrl, planId })
      onClose()
    } catch (err) {
      setError(err?.message || "Couldn't save that link.")
      setSaving(false)
    }
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[300px] sm:w-80 bg-card border border-border rounded-2xl shadow-xl p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Link2 className="w-3.5 h-3.5 text-blue-500" /> Save a link
        </div>

        <input
          autoFocus
          type="text"
          placeholder="Paste or type a URL…"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
        />

        <input
          type="text"
          placeholder="Name this link…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
        />

        {plans.length > 1 && (
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:border-ring/40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-xs font-semibold disabled:opacity-40 hover:shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save link'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuickAddLinkPopover