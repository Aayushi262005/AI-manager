import React from 'react'
import { Check } from 'lucide-react'

export const PLAN_COLORS = ['#7C3AED', '#059669', '#DC2626', '#D97706', '#2563EB', '#DB2777', '#0891B2', '#4F46E5']

const ColorSwatchPicker = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2.5">
      {PLAN_COLORS.map((color) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Select color ${color}`}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              selected ? 'ring-2 ring-offset-2 ring-ring scale-105' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          >
            {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}

export default ColorSwatchPicker