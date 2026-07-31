import React from 'react'
import { HeartPulse } from 'lucide-react'
import Card from '../components/Card'
import { Target, Timer, LayoutGrid, TrendingUp, Brain, Database } from 'lucide-react'
const Features = () => {
  return (
    <div id="features">
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-6 ">
            <div className="inline-flex items-center gap-2 px-2 py-2 rounded-full border border-border bg-accent mb-8">
                <HeartPulse className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary ">
                    Everything you need to execute
                </span>
            </div>
            <h1 className="text-4xl font-bold text-foreground leading-tight mb-6">
                One system. Long-term results.
            </h1>
             <p className="text-lg text-muted-foreground leading-relaxed w-1/1">
                   Plans that adapt. Sessions that track real progress. Insights that reward consistency.
            </p>
        </div>
        <div className="px-15">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 py-20">
            <Card 
                icon={Target}
                iconbg= 'bg-accent'
                iconcolor= 'text-primary'
                title="Adaptive Planning"
                description="Set a long-term goal. StudyIt breaks it into tasks, estimates the effort, and continuously adapts the plan as real life happens."
            />
            <Card 
                icon={Timer}
                iconbg= 'bg-blue-100'
                iconcolor= 'text-blue-600'
                title="Focused Sessions"
                description="Start a session on any task. Track actual progress — not just time. A task may take multiple sessions. You control what counts as done."
            />
            <Card 
                icon={LayoutGrid}
                iconbg= 'bg-emerald-100'
                iconcolor= 'text-emerald-600'
                title="Smart Planner"
                description="See your workload by day — not your timetable. Understand how much you can realistically do before deadlines arrive."
            />
            <Card 
                icon={TrendingUp}
                iconbg= 'bg-purple-100'
                iconcolor= 'text-purple-600'
                title="Excecution Insights"
                description="Track consistency streaks, completion rates, and session averages. Reward yourself for showing up — not for hours logged."
            />
            <Card 
                icon={Database}
                iconbg= 'bg-pink-100'
                iconcolor= 'text-pink-600'
                title="Knowledge Layer"
                description="Every plan has its own knowledge area. Notes, links, attachments, and resources — always linked to the work they belong to."
            />
            <Card 
                icon={Brain}
                iconbg= 'bg-yellow-100'
                iconcolor= 'text-yellow-600'
                title="AI Intelligence"
                description="More than a chatbot. Ask it to rebuild your schedule, estimate a deadline, or prioritize your backlog. It knows your entire plan."
            />

        </div>
        </div>
    </div>
  )
}

export default Features