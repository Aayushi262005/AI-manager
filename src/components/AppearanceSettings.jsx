import React from 'react'
import { Moon, Sun } from 'lucide-react'

const AppearanceSettings = ({ theme, onToggle }) => {
  const isDark = theme === 'dark'

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="absolute top-0 left-10 right-10 h-[2px] rounded-b-full bg-gradient-to-r from-primary/50 to-chart-2/50" />

      <div className="px-8 py-6 border-b border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2.5">
          {isDark ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
          Appearance
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
          Switch between light and dark mode.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 px-8 py-6">
        <div>
          <div className="text-sm font-medium text-foreground">Dark mode</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {isDark ? 'Currently on.' : 'Currently off.'} Easier on the eyes for late-night study sessions.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={onToggle}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-[var(--switch-background)]'}`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              isDark ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default AppearanceSettings