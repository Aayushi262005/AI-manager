import React, { useState } from 'react'
import { Bell, Brain, Plus, Menu, ChevronDown, Target, FileText } from 'lucide-react'

const SECTION_LABELS={
    overview: 'Overview',
    plans: 'Plans',
    planner: 'Planner',
    insights: 'Insights',
    knowledge: 'Knowledge',
    copilot: 'AI Copilot',
    settings: 'Settings',
}

const Header = ({ activeSection, onNavigate, onNewPlan, onNewNote, onMenuClick }) => {
  const [newMenuOpen, setNewMenuOpen] = useState(false)

  const handleSelect = (action) => {
    setNewMenuOpen(false)
    action()
  }

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border px-4 sm:px-7 py-3.5 flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <button
        onClick={onMenuClick}
        className='lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted transition-colors'>
            <Menu className='w-5 h-5 text-foreground'/>
        </button>
        <div className="text-[15px] font-semibold text-foreground truncate">
        {SECTION_LABELS[activeSection]}
        </div>
        <div className='flex gap-1.5 sm:gap-2.5 ml-auto items-center'>
            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-card" />
            </button>
            <button
            onClick={()=> onNavigate('copilot')}
            className='flex items-center gap-1 text-xs font-semibold bg-accent text-primary border border-border px-2.5 sm:px-3 py-2 rounded-xl hover:bg-accent/70 transition-colors'>
                <Brain className='w-3.5 h-3.5'/>
                <span className='hidden sm:inline'>Adjust it</span>
            </button>

            <div className="relative">
              <button
              onClick={() => setNewMenuOpen((v) => !v)}
              className='bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200'>
                  <Plus className='h-3.5 w-3.5 '/>
                  <span className='hidden sm:inline'>
                      New
                  </span>
                  <ChevronDown className='h-3.5 w-3.5 hidden sm:inline' />
              </button>

              {newMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    <button
                      type="button"
                      onClick={() => handleSelect(onNewPlan)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Target className="w-4 h-4 text-primary" /> New plan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect(onNewNote)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left border-t border-border"
                    >
                      <FileText className="w-4 h-4 text-blue-500" /> New note
                    </button>
                  </div>
                </>
              )}
            </div>

        </div>
    </header>
  )
}

export default Header