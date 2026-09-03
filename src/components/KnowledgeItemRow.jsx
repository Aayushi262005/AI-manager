import React from 'react'
import { FileText, Link2, Bookmark, Trash2, ExternalLink } from 'lucide-react'

const TYPE_ICON = {
  note: { Icon: FileText, className: 'text-primary' },
  link: { Icon: Link2, className: 'text-blue-500' },
}

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

const KnowledgeItemRow = ({ resource, planName, onTogglePin, onDelete, onOpenNote }) => {
  const { Icon, className } = TYPE_ICON[resource.type] || TYPE_ICON.note

  const handleOpen = () => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer')
    } else if (resource.type === 'note') {
      onOpenNote(resource)
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/60 transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${className}`} />
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className="flex-1 min-w-0 text-left"
      >
        <div className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
          {resource.title}
          {resource.type === 'link' && <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
          {planName && <span>{planName}</span>}
          <span>· {formatUpdated(resource.updatedAt)}</span>
        </div>
      </button>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={() => onTogglePin(resource)}
          title={resource.pinned ? 'Unpin' : 'Pin'}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <Bookmark className={`w-3.5 h-3.5 ${resource.pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(resource)}
          title="Delete"
          className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        </button>
      </div>
    </div>
  )
}

export default KnowledgeItemRow