import React, { useEffect, useMemo, useState } from 'react'
import { Search, X, Plus, Bookmark, FileText, Link2, ExternalLink, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPlans } from '../services/planService'
import {
  subscribeToKnowledge, createNote, createLink,
  togglePin, deleteResource, updateNote, moveResourceToPlan,
} from '../services/knowledgeService'
import KnowledgeItemRow from './KnowledgeItemRow'
import QuickAddLinkPopover from './QuickAddLinkPopover'
import NoteEditor from './NoteEditor'
import { friendlyFirestoreError } from '../utils/errors'

const TYPE_ICON = { note: FileText, link: Link2 }

const KnowledgeSection = ({ newNoteSignal }) => {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [viewingNote, setViewingNote] = useState(null)
  const [isNewNote, setIsNewNote] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user) return
    const unsubPlans = subscribeToPlans(user.uid, setPlans)
    const unsubKnowledge = subscribeToKnowledge(user.uid, (data) => {
      setResources(data)
      setLoading(false)
    })
    return () => {
      unsubPlans()
      unsubKnowledge()
    }
  }, [user])

  useEffect(() => {
    if (!actionError) return
    const t = setTimeout(() => setActionError(''), 4000)
    return () => clearTimeout(t)
  }, [actionError])

  // Keep the editor in sync if the underlying doc changes (e.g. pin or
  // plan changed from within the editor itself) or gets deleted out from
  // under it.
  useEffect(() => {
    if (!viewingNote) return
    const latest = resources.find((r) => r.id === viewingNote.id)
    if (!latest) {
      setViewingNote(null)
    } else if (latest !== viewingNote) {
      setViewingNote(latest)
    }
  }, [resources, viewingNote])

  const planNameById = useMemo(() => {
    const map = {}
    plans.forEach((p) => { map[p.id] = p.name })
    return map
  }, [plans])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resources
    return resources.filter((r) =>
      r.title.toLowerCase().includes(q) || (planNameById[r.planId] || '').toLowerCase().includes(q)
    )
  }, [resources, query, planNameById])

  const pinned = filtered.filter((r) => r.pinned)
  const recent = filtered.filter((r) => !r.pinned)

  const handleTogglePin = async (resource) => {
    try {
      await togglePin(user.uid, resource.id, !resource.pinned)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }

  const handleDelete = async (resource) => {
    try {
      await deleteResource(user.uid, resource)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }

  const handleChangePlan = async (resource, planId) => {
    try {
      await moveResourceToPlan(user.uid, resource.id, planId)
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }

  const handleSaveNote = async ({ title, body }) => {
    await updateNote(user.uid, viewingNote.id, { title, body })
  }

  const handleSaveLink = async (payload) => {
    await createLink(user.uid, payload)
  }

  // Opens an existing note in the full-page editor.
  const openExistingNote = (resource) => {
    setIsNewNote(false)
    setViewingNote(resource)
  }

  const handleOpenResource = (resource) => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer')
    } else {
      openExistingNote(resource)
    }
  }

  // "New note" skips the old add-resource dialog entirely — it creates a
  // blank note straight away and drops the user right into the full-page
  // editor to write it. If they back out without typing anything, the
  // editor quietly deletes the blank doc again (see NoteEditor's isNew
  // handling), so this never litters the list with "Untitled note" junk.
  const handleCreateNote = async () => {
    setAddMenuOpen(false)
    if (plans.length === 0) {
      setActionError("You'll need a plan first — notes live inside a plan.")
      return
    }
    const planId = plans[0].id
    try {
      const ref = await createNote(user.uid, { title: '', body: '', planId })
      setIsNewNote(true)
      setViewingNote({
        id: ref.id,
        type: 'note',
        title: '',
        body: '',
        planId,
        pinned: false,
        updatedAt: null,
      })
    } catch (err) {
      setActionError(friendlyFirestoreError(err))
    }
  }

   useEffect(() => {
    if (!newNoteSignal || loading) return

    handleCreateNote()
  }, [newNoteSignal, loading])
  
  const handleOpenLinkPopover = () => {
    setAddMenuOpen(false)
    if (plans.length === 0) {
      setActionError("You'll need a plan first — links live inside a plan.")
      return
    }
    setLinkPopoverOpen(true)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <p className="text-sm text-muted-foreground">Loading knowledge…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Knowledge</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Notes and links — organized by plan</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setAddMenuOpen((v) => !v)}
              className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add resource
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {addMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-primary" /> New note
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenLinkPopover}
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
                <QuickAddLinkPopover
                  plans={plans}
                  onClose={() => setLinkPopoverOpen(false)}
                  onSave={handleSaveLink}
                />
              </>
            )}
          </div>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search notes and links…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
            <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No resources yet</p>
            <p className="text-sm text-muted-foreground">
              Save a note or a useful link against one of your plans.
            </p>
          </div>
        )}

        {pinned.length > 0 && (
          <>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Pinned</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {pinned.map((r) => {
                const Icon = TYPE_ICON[r.type] || FileText
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleOpenResource(r)}
                    className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="absolute top-0 left-8 right-8 h-[2px] rounded-b-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] text-muted-foreground capitalize">{r.type}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.type === 'link' && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); handleTogglePin(r) }}
                          title="Unpin"
                          className="p-1 rounded hover:bg-accent transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-primary fill-primary" />
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">{r.title}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{planNameById[r.planId] || 'Unknown plan'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {recent.length > 0 && (
          <>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              {pinned.length > 0 ? 'Recent' : 'All resources'}
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-sm divide-y divide-border">
              {recent.map((r) => (
                <KnowledgeItemRow
                  key={r.id}
                  resource={r}
                  planName={planNameById[r.planId]}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDelete}
                  onOpenNote={openExistingNote}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {actionError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-rose-700 shadow-lg">
          {actionError}
        </div>
      )}

      {viewingNote && (
        <NoteEditor
          resource={viewingNote}
          planName={planNameById[viewingNote.planId]}
          plans={plans}
          isNew={isNewNote}
          onClose={() => { setViewingNote(null); setIsNewNote(false) }}
          onSave={handleSaveNote}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onChangePlan={handleChangePlan}
        />
      )}
    </div>
  )
}

export default KnowledgeSection

