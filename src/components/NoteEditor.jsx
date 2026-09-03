import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, Bookmark, Trash2, Check, Loader2, AlertCircle, ChevronDown } from 'lucide-react'

const AUTOSAVE_DELAY = 900 // ms of no typing before we persist

const formatUpdated = (timestamp) => {
  if (!timestamp?.toDate) return ''
  const d = timestamp.toDate()
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
const NoteEditor = ({ resource, planName, plans, isNew, onClose, onSave, onDelete, onTogglePin, onChangePlan }) => {
  const [title, setTitle] = useState(resource.title)
  const [body, setBody] = useState(resource.body || '')
  const [status, setStatus] = useState('saved') // 'saved' | 'unsaved' | 'saving' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const bodyRef = useRef(null)
  const saveTimer = useRef(null)
  const latestValues = useRef({ title, body })
  const savedValues = useRef({ title: resource.title, body: resource.body || '' })
  const closing = useRef(false)

  latestValues.current = { title, body }

  // Auto-grow the body textarea so the whole page scrolls like a document
  // instead of scrolling inside a fixed-height box.
  const resizeBody = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    resizeBody()
  }, [body, resizeBody])

  const performSave = useCallback(async () => {
    const { title: t, body: b } = latestValues.current
    const payload = { title: t.trim() || 'Untitled note', body: b }
    setStatus('saving')
    setErrorMsg('')
    try {
      await onSave(payload)
      savedValues.current = { title: payload.title, body: payload.body }
      if (!closing.current) setStatus('saved')
    } catch (err) {
      if (!closing.current) {
        setStatus('error')
        setErrorMsg(err?.message || "Couldn't save just now.")
      }
      throw err
    }
  }, [onSave])

  const scheduleSave = useCallback(() => {
    setStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      performSave()
    }, AUTOSAVE_DELAY)
  }, [performSave])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    scheduleSave()
  }

  const handleBodyChange = (e) => {
    setBody(e.target.value)
    scheduleSave()
  }

  const hasUnsavedWork = () => {
    const { title: t, body: b } = latestValues.current
    return t !== savedValues.current.title || b !== savedValues.current.body
  }

  const isUntouchedBlank = () => {
    const { title: t, body: b } = latestValues.current
    return !t.trim() && !b.trim()
  }

  const flushAndClose = useCallback(async () => {
    closing.current = true
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (isNew && isUntouchedBlank()) {
      // Never left a blank "Untitled note" behind just because the user
      // opened the editor and backed straight out.
      try {
        await onDelete(resource)
      } catch {
        // Non-fatal — worst case an empty note lingers in the list.
      }
      onClose()
      return
    }
    if (hasUnsavedWork()) {
      try {
        await performSave()
      } catch {
        // Swallow — closing shouldn't be blocked by a failed save; the
        // note simply keeps whatever was last successfully persisted.
      }
    }
    onClose()
  }, [performSave, onClose, isNew, onDelete, resource])

  // Warn on hard tab-close/refresh if there's an autosave still pending.
  useEffect(() => {
    const handler = (e) => {
      if (status === 'unsaved' || status === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') flushAndClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [flushAndClose])

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${resource.title}"? This can't be undone.`)) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    closing.current = true
    await onDelete(resource)
    onClose()
  }

  const StatusIndicator = () => {
    if (status === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
        </span>
      )
    }
    if (status === 'unsaved') {
      return <span className="text-xs text-muted-foreground">Unsaved changes</span>
    }
    if (status === 'error') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" /> {errorMsg || "Couldn't save"}
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="w-3.5 h-3.5 text-emerald-500" /> Saved
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 h-14 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={flushAndClose}
            title="Back to Knowledge"
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          {plans && plans.length > 0 ? (
            <div className="hidden sm:block relative">
              <select
                value={resource.planId || ''}
                onChange={(e) => onChangePlan(resource, e.target.value)}
                className="appearance-none text-xs font-medium text-primary bg-accent pl-2.5 pr-6 py-1 rounded-full truncate max-w-[180px] focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-primary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : planName ? (
            <span className="hidden sm:inline-block text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full truncate">
              {planName}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <StatusIndicator />
          <div className="w-px h-5 bg-border hidden sm:block" />
          <button
            type="button"
            onClick={() => onTogglePin(resource)}
            title={resource.pinned ? 'Unpin' : 'Pin'}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${resource.pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete"
            className="p-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>
          <button
            type="button"
            onClick={flushAndClose}
            className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>

      {/* Document body — a floating "page" card on a muted backdrop, Word/Docs style */}
      <div className="flex-1 overflow-y-auto bg-muted/60">
        <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="bg-card border border-border rounded-2xl shadow-sm px-6 sm:px-14 py-10 sm:py-14 min-h-[calc(100vh-9rem)]">
            <textarea
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled note"
              rows={1}
              autoFocus={isNew}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              className="w-full resize-none overflow-hidden bg-transparent text-3xl sm:text-4xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none leading-tight"
            />

            <div className="mt-2 mb-8 pb-6 border-b border-border text-xs text-muted-foreground">
              {planName ? `${planName} · ` : ''}Edited {formatUpdated(resource.updatedAt) || 'just now'}
            </div>

            <textarea
              ref={bodyRef}
              value={body}
              onChange={handleBodyChange}
              placeholder="Start writing…"
              className="w-full min-h-[45vh] resize-none bg-transparent text-base sm:text-lg leading-relaxed text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditor