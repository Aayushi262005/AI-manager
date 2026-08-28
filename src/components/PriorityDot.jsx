import React from 'react'
import { Flag } from 'lucide-react'

const PriorityDot = ({ priority }) => (
  <Flag
    className={`w-3 h-3 shrink-0 ${
      priority === 'high' ? 'text-rose-400' : priority === 'medium' ? 'text-amber-400' : 'text-gray-300'
    }`}
  />
)

export default PriorityDot