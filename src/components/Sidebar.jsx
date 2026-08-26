import React from 'react'
import {LayoutGrid, Target, BarChart2, Activity, Database, Brain,Settings, Layers, ChevronDown, Search, LogOut, X} from 'lucide-react'

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id:'plans', label: 'Plans', icon: Target },
    { id: 'planner', label: 'Planner', icon: BarChart2 },
    { id: 'insights', label: 'Insights', icon: Activity },
    { id: 'knowledge', label: 'Knowledge', icon: Database },
    { id: 'copilot', label: 'AI Copilot', icon: Brain, ai: true },
    { id: 'settings', label: 'Settings', icon: Settings },
]
const getInitials = (name, email) => {
    if(name){
        return name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()
    }
    return (email?.[0] || '?').toUpperCase()
}
const Sidebar = ({ activeSection, onNavigate, user, onLogout, isOpen, onClose}) => {
    const displayName = user?.displayName || user?.email || 'Your Workspace'
    const initials = getInitials(user?.displayName, user?.email)
     const handleNavClick = (id) => {
    onNavigate(id)
    onClose?.()
    }
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
 
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:w-56 lg:flex-shrink-0 lg:h-screen
        `}
      >
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <div className='px-3 py-3.5 border-b border-border'>
            <button className='w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted transition-colors'>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm flex-shrink-0" >
                    <Layers className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className='text-left min-w-0 flex-1'>
                   <div className="text-xs font-bold text-foreground truncate">{displayName}'s Workspace</div>
                    <div className="text-[10px] text-muted-foreground">Free plan</div>  
                </div>
                <ChevronDown className='h-3.5 w-3.5 text-muted-foreground shrink-0'/>
            </button>
        </div>

        <nav className='flex-1 px-3 pb-3 overflow-y-auto space-y-0.5 pt-3.5'>
            {NAV_ITEMS.map(item =>(
                <button
                key={item.id}
                onClick={()=> handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all duration-150 text-left ${
                    activeSection === item.id?
                    'bg-accent text-primary font-semibold'
                    :'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                >
                    <item.icon className='w-4 h-4 shrink-0'/>
                    <span className='flex-1'>{item.label}</span>
                    {item.ai && (
                        <span className="text-[10px] bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-bold px-1.5 py-0.5 rounded-md">
                            AI
                    </span>
                )}
                </button>
            ))}
        </nav>

         <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-muted transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md flex-shrink-0">
            {initials}
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground truncate">
              {user?.displayName || 'Your account'}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <LogOut className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </button>
      </div>
    </aside>
    </>
  )
}

export default Sidebar