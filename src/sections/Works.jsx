import React from 'react'
import { Target, Timer, RefreshCw } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Target,
    title: 'Goal',
    description: 'Set a long-term goal. StudyIt breaks it into tasks and estimates the effort for each.',
  },
  {
    number: '02',
    icon: Timer,
    title: 'Focus',
    description: 'Start a session on any task. Track real progress, not just time spent on the clock.',
  },
  {
    number: '03',
    icon: RefreshCw,
    title: 'Adapt',
    description: 'Life happens. Your plan automatically rebuilds around what actually got done.',
  },
]

const Works = () => {
  return (
    <div className="bg-background py-10 px-6 mb-20" id="works">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
          How it works
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Three steps. No rigid timetable — just a plan that keeps up with you.
        </p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 ">
        <div className="hidden md:block absolute top-6 left-[16.66%] right-[16.66%] h-px bg-accent" />
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-6 shadow-md">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary mb-2">
                {step.number}
              </span>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Works