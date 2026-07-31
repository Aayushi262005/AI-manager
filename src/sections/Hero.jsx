import React from 'react'
import dashboard_preview from '../assets/dashboard_preview.png'
import { Sparkles } from 'lucide-react'


const Hero = () => {
  return (
    <div className="w-full bg-background pt-26 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-30 items-center">
            {/* left side */}
            <div>
                <div className="inline-flex items-center gap-2 px-2 py-2 rounded-full border border-border bg-accent mb-8">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                        Adaptive excecution workspace
                    </span>
                </div>
                <h1 className="text-5xl font-bold text-foreground leading-tight mb-6">
                    What should I<br/>
                    work on next?<br/>
                    <span className="text-primary">Answered daily.</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    StudyIt is an adaptive workspace that helps you plan long-term goals, execute through focused sessions, and automatically rebuilds your plan when life gets in the way.
                </p>
                 <button className="mt-8 flex items-center gap-2 px-4 py-2.5 text-base font-medium text-primary-foreground bg-primary rounded-full hover:opacity-90 transition-transform duration-300 hover:-translate-y-1">
                 Get started free
                </button>
            </div>
            {/* right side */}
            <div className="rounded-2xl border border-border overflow-hidden shadow-2xl max-w-md">
                <img src={dashboard_preview} alt="Dashboard Preview" className="w-full h-auto" />
            </div>
        </div>
    </div>
  )
}

export default Hero